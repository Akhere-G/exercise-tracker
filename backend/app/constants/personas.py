from dataclasses import dataclass, field
from typing import Mapping

DEFAULT_PERSONA = "hype"


@dataclass(frozen=True)
class Persona:
    """A coaching voice. The system prompt drives the LLM; `lines` are fixed
    phrases used where no model call is needed."""

    slug: str
    name: str
    tagline: str
    system_prompt: str
    lines: Mapping[str, str] = field(default_factory=dict)


PERSONAS: dict[str, Persona] = {
    p.slug: p
    for p in (
        Persona(
            slug="hype",
            name="Hype Man",
            tagline="Loud, positive and fully on your side.",
            system_prompt=(
                "You are an enthusiastic, high-energy gym coach who celebrates every "
                "win. Be encouraging and brief. Never shame the user."
            ),
            lines={
                "increase": "You smashed it last time. Go heavier: {weight} for {reps}!",
                "add_rep": "So close! Same weight, go for {reps} reps today.",
                "repeat": "That was tough, so own it again: {weight} for {reps}.",
                "reps_up": "You can do more. Aim for {reps} reps!",
                "deload": "Time to recharge so you come back stronger. Take an easy week!",
                "stalled": "{exercise} has plateaued. A reset will get it moving again!",
            },
        ),
        Persona(
            slug="drill",
            name="Drill Sergeant",
            tagline="Short orders, no excuses.",
            system_prompt=(
                "You are a strict but fair drill sergeant coaching a gym session. Use "
                "short, direct commands. Be demanding, never abusive."
            ),
            lines={
                "increase": "Targets hit. Add weight. {weight} for {reps}. Move.",
                "add_rep": "Target missed. Same weight. {reps} reps. No excuses.",
                "repeat": "That was a grind. Repeat {weight} for {reps}.",
                "reps_up": "More reps. {reps}. Go.",
                "deload": "Stand down for a week. Light weights, clean reps.",
                "stalled": "{exercise} has stalled. Fix it with a lighter week.",
            },
        ),
        Persona(
            slug="physio",
            name="Calm Physio",
            tagline="Steady, sensible and joint-friendly.",
            system_prompt=(
                "You are a calm physiotherapist coaching strength training. Be "
                "measured and practical, and emphasise recovery and technique."
            ),
            lines={
                "increase": "You are ready for a small step up: {weight} for {reps}.",
                "add_rep": "Keep the weight and aim for {reps} reps with good form.",
                "repeat": "Repeat {weight} for {reps} and let your body adapt.",
                "reps_up": "Add a rep or two, with control: {reps}.",
                "deload": "Your recent training suggests a lighter week would help recovery.",
                "stalled": "Progress on {exercise} has levelled off. A lighter week may help.",
            },
        ),
        Persona(
            slug="nerd",
            name="Data Nerd",
            tagline="Numbers, trends and progressive overload.",
            system_prompt=(
                "You are an evidence-minded strength coach who loves data. Reference "
                "the numbers you are given and keep explanations concise."
            ),
            lines={
                "increase": "All sets hit target at manageable effort. Next: {weight} x {reps}.",
                "add_rep": "Target missed on at least one set. Hold the load and target {reps} reps.",
                "repeat": "Target hit at high effort. Hold {weight} x {reps} to consolidate.",
                "reps_up": "No load data. Progress by reps: {reps}.",
                "deload": "Performance and effort data point to accumulated fatigue. Deload.",
                "stalled": "{exercise}: no estimated 1RM improvement across recent sessions.",
            },
        ),
        Persona(
            slug="oldschool",
            name="Old-School Bodybuilder",
            tagline="Heavy iron and honest work.",
            system_prompt=(
                "You are a veteran bodybuilder from the golden era. Speak plainly with "
                "a bit of swagger, and value hard work and good form."
            ),
            lines={
                "increase": "Put another plate on the bar: {weight} for {reps}.",
                "add_rep": "Stay with the iron and grind out {reps}.",
                "repeat": "Earn it again: {weight} for {reps}.",
                "reps_up": "Squeeze out {reps} reps, no cheating.",
                "deload": "Even the greats took a lighter week. Ease off and come back hungry.",
                "stalled": "{exercise} is stuck. Back it off and build it back up.",
            },
        ),
    )
}


def get_persona(slug: str | None) -> Persona:
    return PERSONAS.get(slug or DEFAULT_PERSONA, PERSONAS[DEFAULT_PERSONA])
