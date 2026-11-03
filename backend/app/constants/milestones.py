from dataclasses import dataclass

VARIETY_THRESHOLDS = (5, 10, 20, 30, 50, 100)


@dataclass(frozen=True)
class Milestone:
    type: str
    name: str
    description: str
    icon: str


MILESTONES: tuple[Milestone, ...] = (
    Milestone("first_workout", "First Workout", "Log your first workout", "flag"),
    Milestone(
        "back_to_back", "Back to Back", "Work out on two consecutive days", "repeat"
    ),
    Milestone("early_bird", "Early Bird", "Start a workout before 7am", "sunrise"),
    Milestone("night_owl", "Night Owl", "Start a workout at 9pm or later", "moon"),
    Milestone(
        "weekend_warrior",
        "Weekend Warrior",
        "Work out on both Saturday and Sunday",
        "swords",
    ),
    Milestone("century", "Century", "Complete 100 workouts", "party-popper"),
    Milestone(
        "marathon_session",
        "Marathon Session",
        "Train for 90 minutes or more in one workout",
        "hourglass",
    ),
    Milestone(
        "ton_up", "Ton Up", "Lift 10,000 kg of total volume in one workout", "weight"
    ),
    *(
        Milestone(
            f"variety_{count}",
            f"Variety {count}",
            f"Use {count} different exercises",
            "shapes",
        )
        for count in VARIETY_THRESHOLDS
    ),
)

MILESTONE_TYPES = [milestone.type for milestone in MILESTONES]
