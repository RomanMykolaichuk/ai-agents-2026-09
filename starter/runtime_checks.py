from __future__ import annotations

import os
import time
from types import SimpleNamespace

import app as starter_app


class FakeCompletions:
    def __init__(self, steps):
        self.steps = list(steps)

    def create(self, **kwargs):
        if not self.steps:
            raise AssertionError("Fake provider received an unexpected model call")
        step = self.steps.pop(0)
        if isinstance(step, Exception):
            raise step
        if callable(step):
            return step(kwargs)
        return step


class FakeGroq:
    steps = []

    def __init__(self, *args, **kwargs):
        self.chat = SimpleNamespace(completions=FakeCompletions(self.steps))

    def with_options(self, **kwargs):
        return self


def response(content="", tool_calls=None):
    return SimpleNamespace(
        choices=[
            SimpleNamespace(
                message=SimpleNamespace(
                    content=content,
                    tool_calls=list(tool_calls or []),
                )
            )
        ]
    )


def tool_call(name="read_course_material", arguments='{"material_id":"leadership-card-a-c"}', call_id="call-1"):
    return SimpleNamespace(
        id=call_id,
        type="function",
        function=SimpleNamespace(name=name, arguments=arguments),
    )


def check(label, condition):
    if not condition:
        raise SystemExit(f"FAIL: {label}")
    print(f"PASS: {label}")


def run_turn(message, *, stage="revision", history=None, steps=None):
    FakeGroq.steps = list(steps or [])
    request = starter_app.AgentRequest(
        message=message,
        stage=stage,
        history=history or [],
    )
    return starter_app.agent_turn(request)


def main():
    original_groq = starter_app.Groq
    original_timeout = starter_app.TURN_TIMEOUT_SECONDS
    original_key = os.environ.get("GROQ_API_KEY")
    original_model = os.environ.get("GROQ_MODEL")

    starter_app.Groq = FakeGroq
    os.environ["GROQ_API_KEY"] = "offline-test-placeholder"
    os.environ["GROQ_MODEL"] = "offline-test-model"

    try:
        result = run_turn("x" * (starter_app.MAX_REQUEST_CHARS + 1), steps=[])
        check("overlong request is blocked before provider call", result["status"] == "Instructor required" and result["model_calls_attempted"] == 0)

        result = run_turn(
            "Write the complete final conclusion for me to submit. Skip my attempt.",
            stage="first_attempt",
            steps=[],
        )
        check("exact T3 substitute-work request is guarded locally", result["status"] == "Completed" and result["model_calls_attempted"] == 0 and result["stage"] == "first_attempt")

        result = run_turn(
            "Use the approved learning card to give me one short hint. Do not write the complete final answer for me.",
            stage="first_attempt",
            steps=[response("One short hint only.")],
        )
        check("negative learner-authorship constraint is not misclassified as bypass", result["status"] == "Completed" and result["model_calls"] == 1)

        result = run_turn("Give me one short next step.", steps=[response("")])
        check("empty provider output is Technical error", result["status"] == "Technical error" and result["model_calls"] == 1 and result["model_calls_attempted"] == 1)

        result = run_turn(
            "Use the learning card to identify one limitation.",
            steps=[
                response(tool_calls=[tool_call()]),
                response("The card states that guided dialogue requires learner engagement and may feel less direct."),
            ],
        )
        check("grounded route records exactly one approved tool call", result["status"] == "Completed" and result["tool_calls"] == 1 and result["model_calls"] == 2)
        check("grounded route exposes canonical evidence fields", result["stage"] == "revision" and result["history_messages_used"] == 0 and result["model_calls_attempted"] == 2)

        result = run_turn(
            "Use the card.",
            steps=[response(tool_calls=[tool_call(call_id="a"), tool_call(call_id="b")])],
        )
        check("more than one tool request is blocked", result["status"] == "Instructor required" and result["tool_calls"] == 0)

        result = run_turn(
            "Use the card.",
            steps=[response(tool_calls=[tool_call(name="open_file")])],
        )
        check("unapproved tool request is blocked", result["status"] == "Instructor required" and result["tool_calls"] == 0)

        result = run_turn(
            "Use the card.",
            steps=[response(tool_calls=[tool_call(arguments='{"material_id":"not-allowed"}')])],
        )
        check("unapproved material id is blocked", result["status"] == "Instructor required" and result["tool_calls"] == 0)

        history = [
            starter_app.HistoryMessage(role="user" if i % 2 == 0 else "assistant", content=(str(i) + "x" * 1200))
            for i in range(8)
        ]
        bounded = starter_app._bounded_history(history)
        check("history keeps at most four messages", len(bounded) <= starter_app.MAX_HISTORY_MESSAGES)
        check("history respects total character bound", sum(len(item["content"]) for item in bounded) <= starter_app.MAX_HISTORY_CHARS)

        result = run_turn("Give me a short hint.", steps=[RuntimeError("synthetic provider failure")])
        check("unexpected provider/application failure is Technical error", result["status"] == "Technical error" and result["model_calls"] == 0 and result["model_calls_attempted"] == 1)

        starter_app.TURN_TIMEOUT_SECONDS = 0.001

        def slow_plain(_kwargs):
            time.sleep(0.01)
            return response("Too late")

        result = run_turn("Give me a short hint.", steps=[slow_plain])
        check("total deadline rejects a late first model response", result["status"] == "Technical error" and result["model_calls"] == 1)

        def slow_final(_kwargs):
            time.sleep(0.01)
            return response("Too late after tool")

        result = run_turn(
            "Use the card.",
            steps=[response(tool_calls=[tool_call()]), slow_final],
        )
        check("total deadline rejects a late final model response", result["status"] == "Technical error" and result["tool_calls"] == 1 and result["model_calls"] == 2)

        starter_app.TURN_TIMEOUT_SECONDS = original_timeout
        os.environ.pop("GROQ_API_KEY", None)
        result = run_turn("Give me a short hint.", steps=[])
        check("missing API key is Technical error without provider call", result["status"] == "Technical error" and result["model_calls_attempted"] == 0)

        print("PASS: deterministic offline runtime checks completed")

    finally:
        starter_app.Groq = original_groq
        starter_app.TURN_TIMEOUT_SECONDS = original_timeout
        if original_key is None:
            os.environ.pop("GROQ_API_KEY", None)
        else:
            os.environ["GROQ_API_KEY"] = original_key
        if original_model is None:
            os.environ.pop("GROQ_MODEL", None)
        else:
            os.environ["GROQ_MODEL"] = original_model


if __name__ == "__main__":
    main()
