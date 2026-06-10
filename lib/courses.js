import { C } from './alex-theme'

export const COURSES = {
  beginner: {
    id: "beginner",
    title: "Learning to Work with Claude",
    level: "Beginner",
    color: C.green,
    priceZAR: 399,
    tagline: "Go from zero to confident in 8 interactive sessions.",
    sessions: [
      { id:1, title:"What Claude Is (and Isn't)",       tag:"Foundation", icon:"🧠" },
      { id:2, title:"Your First Real Prompt",           tag:"Hands-On",   icon:"✏️" },
      { id:3, title:"Giving Claude Context",            tag:"Technique",  icon:"🎯" },
      { id:4, title:"Claude as Your Thinking Partner",  tag:"Strategy",   icon:"🤝" },
      { id:5, title:"Writing With Claude",              tag:"Practical",  icon:"📝" },
      { id:6, title:"Research & Finding Information",   tag:"Practical",  icon:"🔍" },
      { id:7, title:"Working With Documents",           tag:"Practical",  icon:"📄" },
      { id:8, title:"Iterating — Getting Better Answers", tag:"Mastery", icon:"🔄" },
    ],
  },
  work: {
    id: "work",
    title: "Claude at Work",
    level: "Professional",
    color: C.accent2,
    priceZAR: 599,
    tagline: "Use Claude in your actual job, every single day.",
    sessions: [
      { id:1, title:"Claude for Email & Communication",   tag:"Workplace", icon:"📧" },
      { id:2, title:"Claude for Meetings & Minutes",      tag:"Workplace", icon:"📅" },
      { id:3, title:"Claude for Reports & Proposals",     tag:"Documents", icon:"📊" },
      { id:4, title:"Claude for Research & Decisions",    tag:"Analysis",  icon:"🔎" },
      { id:5, title:"Claude for Presentations",           tag:"Content",   icon:"📽️" },
      { id:6, title:"Claude for HR & People Tasks",       tag:"Workplace", icon:"👥" },
      { id:7, title:"Claude for Customer Communication",  tag:"Business",  icon:"💼" },
      { id:8, title:"Claude as Your Daily Work Assistant",tag:"Mastery",   icon:"⚡" },
    ],
  },
  advanced: {
    id: "advanced",
    title: "Mastering Claude",
    level: "Advanced",
    color: C.accent,
    priceZAR: 999,
    tagline: "Unlock Claude's full power with expert-level techniques.",
    sessions: [
      { id:1, title:"Prompt Architecture",                tag:"Advanced",  icon:"🏗️" },
      { id:2, title:"Chain-of-Thought Reasoning",         tag:"Advanced",  icon:"⛓️" },
      { id:3, title:"Roles, Personas & System Thinking",  tag:"Advanced",  icon:"🎭" },
      { id:4, title:"Multi-Turn Conversations & Memory",  tag:"Advanced",  icon:"🧵" },
      { id:5, title:"Advanced Research & Analysis",       tag:"Advanced",  icon:"🔬" },
      { id:6, title:"Working With Data at Scale",         tag:"Advanced",  icon:"📈" },
      { id:7, title:"Building With Claude (No Code)",     tag:"Advanced",  icon:"🛠️" },
      { id:8, title:"Your Personal Prompt System",        tag:"Mastery",   icon:"🗂️" },
    ],
  },
}

export const TAG_COLORS = {
  Foundation: C.blue, "Hands-On": C.green, Technique: C.accent,
  Strategy: C.purple, Practical: C.green, Mastery: C.accent2,
  Workplace: C.blue, Documents: C.purple, Analysis: C.accent,
  Content: C.green, Business: C.accent2, Advanced: C.red,
}

export const ONBOARDING_Q = [
  { id:"usage",   q:"How often do you currently use AI tools like Claude?",
    opts:["I've never used one","I've tried it a few times","I use it occasionally","I use it regularly"] },
  { id:"goal",    q:"What's your main reason for wanting to learn?",
    opts:["Use AI in my daily job","Work more efficiently","Improve my writing & research","Build things with AI"] },
  { id:"comfort", q:"How comfortable are you writing detailed instructions?",
    opts:["Not at all comfortable","Somewhat comfortable","Pretty comfortable","Very comfortable"] },
]

export const STUCK_WORDS = ["stuck","confused","doesn't work","not working","don't understand","don't get it","i'm lost","no idea","nothing happens","what do i do","i don't know"]
