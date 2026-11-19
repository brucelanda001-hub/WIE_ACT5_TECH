export type Mode = "explain" | "hint" | "example" | "quiz" | "check" | "summary";

export function getMockResponse(mode: Mode, isGroupMode: boolean): string {
  const soloResponses: Record<Mode, string> = {
    explain: "Think of it like two small boxes. Put 3 apples in one, 2 in the other. Count them all: 5 apples. Small steps, big win! 🍎",
    hint: "Small hint: start at the big number and count up. What is the first number after 7? 🤫",
    example: "Example: you have 4 dates, your friend gives 3 more. Count: 5, 6, 7. You have 7 dates! 🌴",
    quiz: "Quick quiz: 2 + 2 = ? A) 3  B) 4. Tell me A or B! 🎯",
    check: "Nice! Can you say it back to me in one small sentence? 🔁",
    summary: "Today: 1) we counted up. 2) we used small steps. 3) you did great. 📝"
  };

  const groupResponses: Record<Mode, string> = {
    explain: "Okay team! Let's look at the board. Who wants to explain how we get 5 apples? Let's hear from someone who hasn't spoken yet! 🙋‍♂️🙋‍♀️",
    hint: "Team huddle! 🤫 Don't say the answer out loud yet. Turn to your partner and whisper a hint to them. What number comes after 7?",
    example: "Group example: Imagine we are at the souk. We buy 4 dates, then 3 more. The person on the left, how many do we have? 🍎",
    quiz: "Classroom Quiz! 🎯 Everyone look at the board. 2 + 2 = ? A) 3  B) 4. Let's do a group vote! Raise your hands for A, then B.",
    check: "Awesome teamwork! Let's go around the circle. Each person says one word about what we just learned. 🔁",
    summary: "Group summary: 📝 1) We listened to each other. 2) We voted on the quiz. 3) We used hints before answers!"
  };

  return isGroupMode ? groupResponses[mode] || groupResponses.explain : soloResponses[mode] || soloResponses.explain;
}