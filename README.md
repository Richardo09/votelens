# VoteLens

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white" />
</p>

<p align="center">
  Modern Election Analytics Dashboard for Structured Vote Monitoring and Visualization
</p>

---

## 📖 About The Project

VoteLens is a modern election analytics dashboard web application designed to help manage, monitor, and analyze election vote data in a structured and efficient way.

Built with a scalable hierarchical regional system starting from electoral districts (*dapil*), subdistricts (*kecamatan*), villages (*kelurahan*), down to polling stations (*TPS*), VoteLens provides comprehensive visualization and recap of party and candidate vote results.

This project was developed as an academic and portfolio project focused on:

- Data visualization
- Role-based authentication
- Election analytics
- Full-stack web development
- Structured regional data management

---

## 🚀 Features

### 🔐 Authentication & Authorization
- Secure login system using Supabase Authentication
- Role-based access control (Admin & User)

### 👤 Admin Features
- Manage users
- Manage candidates
- Manage electoral regions
- Configure TPS data
- Input party votes
- Input candidate votes
- Access all regional data

### 👥 User Features
- View vote data based on assigned electoral district
- Monitor election results
- Access dashboard analytics

### 📊 Analytics & Visualization
- Real-time vote recap
- Candidate vote statistics
- Party vote aggregation
- Structured regional vote hierarchy
- Responsive dashboard interface

### 🧮 Sainte-Laguë Calculation
- Automatic seat allocation simulation
- Candidate electability estimation
- Proportional representation analysis

---

## 🧠 Sainte-Laguë Method

VoteLens implements the Sainte-Laguë method to estimate elected candidates based on party vote totals.

This feature helps simulate seat distribution in proportional electoral systems and provides a more modern analytical approach for election data interpretation.

---

## 🛠️ Tech Stack

### Frontend
- Next.js
- TypeScript
- Tailwind CSS

### Backend & Database
- Supabase Authentication
- Supabase Database
- PostgreSQL

### Deployment
- Vercel (Recommended)

---

## 📂 Project Structure

```bash
src/
├── app/
├── components/
├── hooks/
├── lib/
├── types/
├── utils/
└── services/
```

---

## 📸 Screenshots

> Add application screenshots here

Suggested screenshots:
- Login Page
- Dashboard Overview
- Candidate Management
- Vote Input Form
- Sainte-Laguë Result
- Regional Analytics

---

## ⚙️ Installation

Clone the repository:

```bash
git clone https://github.com/Richardo09/votelens.git
```

Go to project directory:

```bash
cd votelens
```

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

---

## 🔑 Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 🌐 Live Demo

> Add your deployed application URL here

Example:

```bash
https://votelens.vercel.app
```

Deploy easily using:

- Vercel
- Netlify

---

## 📚 Project Purpose

This project is intended for:

- Academic purposes
- Research and learning
- Portfolio showcase
- Election data visualization experiments
- Full-stack development practice

---

## ⚠️ Disclaimer

This project is publicly accessible for educational and academic purposes only.

Unauthorized commercial use, political manipulation, or misuse of election-related data is prohibited without permission from the author.

---

## 📈 Future Improvements

- Real-time chart analytics
- Export PDF reports
- Multi-election support
- Dark mode
- AI-based election trend analysis
- Interactive regional map visualization
- API integration

---

## 👨‍💻 Author

Developed by Richardo

- GitHub: https://github.com/Richardo09
- Portfolio: https://your-portfolio-url.com

---

## ⭐ Support

If you like this project, feel free to give it a star on GitHub!

---

## 📄 License

This project is licensed for educational and portfolio purposes only.

Commercial and political usage requires permission from the author.
