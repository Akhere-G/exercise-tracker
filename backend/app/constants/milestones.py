from dataclasses import dataclass

# (threshold, name, icon)
WORKOUT_COUNT_TIERS = (
    (5, "Getting Started", "sprout"),
    (10, "Dedicated", "dumbbell"),
    (25, "Quarter Century", "target"),
    (50, "Halfway There", "gauge"),
    (250, "Workout Veteran", "shield"),
    (500, "Legend", "crown"),
)

VARIETY_TIERS = (
    (5, "Explorer"),
    (10, "Adventurer"),
    (20, "Trailblazer"),
    (30, "Pathfinder"),
    (50, "Cartographer"),
    (100, "Encyclopedia"),
)

VARIETY_THRESHOLDS = tuple(threshold for threshold, _ in VARIETY_TIERS)
WORKOUT_COUNT_THRESHOLDS = tuple(t for t, _, _ in WORKOUT_COUNT_TIERS)


@dataclass(frozen=True)
class Milestone:
    type: str
    name: str
    description: str
    icon: str


MILESTONES: tuple[Milestone, ...] = (
    Milestone("first_workout", "First Workout", "Log your first workout", "flag"),
    *(
        Milestone(f"workouts_{count}", name, f"Complete {count} workouts", icon)
        for count, name, icon in WORKOUT_COUNT_TIERS
    ),
    Milestone("century", "Century", "Complete 100 workouts", "party-popper"),
    Milestone(
        "back_to_back", "Back to Back", "Work out on two consecutive days", "repeat"
    ),
    Milestone(
        "three_peat", "Three-Peat", "Work out on three consecutive days", "repeat-2"
    ),
    Milestone(
        "five_day_fire", "Five-Day Fire", "Work out on five consecutive days", "flame"
    ),
    Milestone(
        "weekly_warrior",
        "Weekly Warrior",
        "Complete 5 workouts in one week",
        "calendar-check",
    ),
    Milestone(
        "monthly_regular",
        "Monthly Regular",
        "Complete 15 workouts in one month",
        "calendar-days",
    ),
    Milestone(
        "four_week_focus",
        "Four-Week Focus",
        "Work out in 4 consecutive weeks",
        "focus",
    ),
    Milestone(
        "two_month_club",
        "Two-Month Club",
        "Work out in 8 consecutive weeks",
        "users",
    ),
    Milestone(
        "weekend_warrior",
        "Weekend Warrior",
        "Work out on both Saturday and Sunday",
        "swords",
    ),
    Milestone("early_riser", "Early Riser", "Start a workout before 6am", "sunrise"),
    Milestone("early_bird", "Early Bird", "Start a workout before 7am", "sunrise"),
    Milestone(
        "lunch_break_lifter",
        "Lunch Break Lifter",
        "Start a workout between 12pm and 2pm",
        "sun",
    ),
    Milestone("night_owl", "Night Owl", "Start a workout at 9pm or later", "moon"),
    Milestone(
        "midnight_oil", "Midnight Oil", "Start a workout at 11pm or later", "moon-star"
    ),
    Milestone(
        "speed_demon",
        "Speed Demon",
        "Finish a workout of 5 or more sets in under 20 minutes",
        "zap",
    ),
    Milestone(
        "marathon_session",
        "Deep Work",
        "Train for 90 minutes or more in one workout",
        "hourglass",
    ),
    Milestone(
        "heavy_hitter",
        "Heavy Hitter",
        "Lift 5,000 kg of total volume in one workout",
        "dumbbell",
    ),
    Milestone(
        "ton_up", "Ton Up", "Lift 10,000 kg of total volume in one workout", "weight"
    ),
    Milestone(
        "volume_monster",
        "Volume Monster",
        "Lift 20,000 kg of total volume in one workout",
        "mountain",
    ),
    Milestone(
        "triple_threat",
        "Triple Threat",
        "Beat 3 of your personal records in one workout",
        "target",
    ),
    Milestone(
        "record_breaker",
        "Record Breaker",
        "Beat your personal records 10 times",
        "trending-up",
    ),
    *(
        Milestone(
            f"variety_{count}",
            name,
            f"Use {count} different exercises",
            "compass",
        )
        for count, name in VARIETY_TIERS
    ),
    Milestone(
        "new_year_new_gains",
        "New Year, New Gains",
        "Work out on 1 January",
        "sparkles",
    ),
    Milestone(
        "first_anniversary",
        "First Anniversary",
        "Work out a year or more after your first workout",
        "cake",
    ),
)

MILESTONE_TYPES = [milestone.type for milestone in MILESTONES]
