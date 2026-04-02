// In-memory storage for testing without PostgreSQL
const users = [];
const jobSeekers = [];
const jobs = [
  {
    id: 1,
    title: "Senior React Developer",
    company: "TechCorp",
    description: "Looking for an experienced React developer",
    requirements: ["React", "JavaScript", "Redux", "TypeScript"],
    location: "Remote",
    salary_range: "$120,000 - $150,000",
    employment_type: "Full-time",
    is_active: true,
    posted_date: new Date()
  },
  {
    id: 2,
    title: "Python Backend Engineer",
    company: "DataSys",
    description: "Build scalable backend services",
    requirements: ["Python", "Django", "PostgreSQL", "REST APIs"],
    location: "Remote",
    salary_range: "$100,000 - $130,000",
    employment_type: "Full-time",
    is_active: true,
    posted_date: new Date()
  },
  {
    id: 3,
    title: "Full Stack Developer",
    company: "StartupInc",
    description: "Join our startup to build full-stack applications",
    requirements: ["React", "Node.js", "MongoDB", "Express"],
    location: "San Francisco, CA",
    salary_range: "$90,000 - $120,000",
    employment_type: "Full-time",
    is_active: true,
    posted_date: new Date()
  }
];
const applications = [];
const jobMatches = [];

module.exports = { users, jobSeekers, jobs, applications, jobMatches };