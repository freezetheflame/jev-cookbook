"""Offline checks for the cookbook's documented Jev wire shape, not a tokenizer."""

import math
import re


def has_path(value, path):
    for key in path.split("."):
        if not isinstance(value, dict) or key not in value:
            return False
        value = value[key]
    return True


def entry(value, allow_null=False):
    if value is None:
        return allow_null
    return isinstance(value, (str, dict, list)) and bool(value)


def validate_request(payload):
    errors = []
    if not isinstance(payload, dict):
        return ["request must be an object"]
    if set(payload) != {"model", "state", "questions"}:
        errors.append("expected exactly model, state, questions")
    if not isinstance(payload.get("model"), str) or not payload["model"].strip():
        errors.append("model must be a nonempty string")
    state = payload.get("state")
    if not isinstance(state, (str, dict, list)):
        errors.append("state must be text, an object, or an array")
    questions = payload.get("questions")
    if not isinstance(questions, dict) or not questions:
        return errors + ["questions must be a nonempty map"]
    for qid, question in questions.items():
        if not isinstance(question, dict):
            errors.append(f"{qid}: question must be an object")
            continue
        if set(question) - {"type", "instructions", "criteria"}:
            errors.append(f"{qid}: unexpected question fields")
        kind = question.get("type")
        instructions = question.get("instructions")
        criteria = question.get("criteria")
        if not isinstance(kind, str) or kind not in {"choice", "score", "noul"}:
            errors.append(f"{qid}: unknown type {kind!r}")
        if not entry(instructions):
            errors.append(f"{qid}: instructions must be nonempty text/structure")
        if kind == "choice":
            if not isinstance(criteria, dict) or not 2 <= len(criteria) <= 255:
                errors.append(f"{qid}: Choice needs 2-255 options")
            elif any(not key or not entry(value, True) for key, value in criteria.items()):
                errors.append(f"{qid}: invalid Choice descriptions")
        if kind == "score":
            if not isinstance(criteria, list) or not 2 <= len(criteria) <= 10:
                errors.append(f"{qid}: Score needs 2-10 ordered levels")
            elif not all(entry(value) for value in criteria):
                errors.append(f"{qid}: invalid Score levels")
        if kind == "noul" and criteria is not None:
            if not isinstance(criteria, dict) or set(criteria) - {"true", "false"}:
                errors.append(f"{qid}: invalid Noul criteria")
            elif not all(entry(value) for value in criteria.values()):
                errors.append(f"{qid}: invalid Noul descriptions")
        # Examples use backticks only for paths. Structured instructions can also
        # contain local target text, as in the evidence-localization recipe.
        for path in re.findall(r"`([A-Za-z_][\w.]*)`", str(instructions)):
            if not has_path(state, path) and not has_path(instructions, path):
                errors.append(f"{qid}: unknown material reference {path}")
    return errors


def probability(value):
    return type(value) in (int, float) and math.isfinite(value) and 0 <= value <= 1


def validate_response(response, request):
    errors = []
    if not isinstance(response, dict) or not isinstance(response.get("model"), str):
        return ["response must include model"]
    answers = response.get("answers")
    if not isinstance(answers, dict) or set(answers) != set(request["questions"]):
        return ["response answer IDs do not match the request"]
    for qid, question in request["questions"].items():
        answer = answers[qid]
        kind = question["type"]
        if not isinstance(answer, dict) or answer.get("type") != kind:
            errors.append(f"{qid}: wrong answer type")
            continue
        if kind == "noul":
            if not probability(answer.get("noul")):
                errors.append(f"{qid}: invalid noul")
            continue
        if not probability(answer.get("confidence")):
            errors.append(f"{qid}: invalid confidence")
        expected = set(question["criteria"]) if kind == "choice" else {str(i) for i in range(len(question["criteria"]))}
        distribution = answer.get("probabilities")
        if (not isinstance(distribution, dict) or set(distribution) != expected
                or not all(probability(p) for p in distribution.values())):
            errors.append(f"{qid}: invalid probability distribution")
            continue
        if abs(sum(distribution.values()) - 1) > 0.02:
            errors.append(f"{qid}: probabilities do not sum to one")
        if kind == "choice":
            chosen = answer.get("choice")
            if not isinstance(chosen, str) or chosen not in expected:
                errors.append(f"{qid}: choice is outside the candidate set")
            elif distribution[chosen] < max(distribution.values()) - 1e-6:
                errors.append(f"{qid}: choice is not the highest-probability option")
        else:
            score = answer.get("score")
            top = len(question["criteria"]) - 1
            if type(score) not in (int, float) or not math.isfinite(score) or not 0 <= score <= top:
                errors.append(f"{qid}: score is outside the level range")
            elif abs(score - sum(int(i) * p for i, p in distribution.items())) > 0.03:
                errors.append(f"{qid}: score disagrees with the distribution")
    return errors
