# 🏃‍♂️ Health & Exercise Tracker

> **A patient-focused mobile app that brings live Health Connect/HealthKit tracking, a weekly exercise calendar, and nurse chat together—plus an admin panel for managing workouts and monitoring patient progress.**  

<!-- ───── Badge Row ───── -->
[![License](https://img.shields.io/github/license/erayfazilordanuc/health-and-exercise-app-frontend?style=for-the-badge&color=blue)](LICENSE)
[![Contributors](https://img.shields.io/github/contributors/erayfazilordanuc/health-and-exercise-app-frontend?label=CONTRIBS&logo=github&style=for-the-badge)](https://github.com/erayfazilordanuc/health-and-exercise-app-frontend/graphs/contributors)
[![Platform](https://img.shields.io/badge/iOS%20%7C%20Android-React%20Native-8B5CF6?logo=react&logoColor=white&style=for-the-badge)](#)
<!-- ───────────────────── -->

## Table of Contents
1. [Why this project?](#why-this-project)
2. [About](#about)
3. [Core Features](#core-features)
4. [Tech Stack & Architecture](#tech-stack--architecture)
5. [Repositories](#repositories)
6. [App Images](#app-images)

---

## Why this project?
Most fitness apps focus on healthy athletes and overlook patients who need **low-impact rehab routines** and **close, professional oversight**.  
This app closes that gap by providing:

* **Weekly rehab calendar** – a ready-made _Mon / Wed / Fri_ exercise schedule patients can check off as they go.  
* **Live vitals sync** – automatic import of steps, heart-rate and sleep via **Health Connect / HealthKit**.  
* **Manual symptom logging** – patients can quickly record pain, fatigue or other symptoms whenever they occur.  
* **In-app nurse chat** – secure messaging keeps patients motivated and lets nurses respond in real time.  
* **Role-based dashboards** – admins add or edit exercises and monitor each patient’s progress at a glance.

---

## About
**Health & Exercise Tracker** is a cross-platform mobile app that helps
patients follow doctor-approved rehab routines while giving healthcare
staff full visibility into recovery.

### Patient Module
- **Live self-tracking** of steps, heart-rate and sleep via **Health Connect / HealthKit**. Users can add their additional symptoms manually whenever needed
- **Weekly exercise calendar** shows the non-customised programme (e.g. Mon/Wed/Fri) and marks completed sessions.  
- **Group nurse chat** lets patients talk directly with assigned nurses for motivation and quick feedback.

### Admin Module
- **Exercise manager** to add, edit or retire workouts in the catalogue.  
- **Real-time patient symptoms dashboard** that lists each patient’s adherence and latest vitals inside the admin’s group.  
- **Messaging with patient** so nurses can guide patients and track progress without leaving the app.

---

## Core Features
| Category | Highlights |
|----------|------------|
| **Personalised Plans** | Auto-generated daily routines based on user profile & doctor feedback. |
| **Weekly Progress Rings** | Animated circular charts track completion % for each scheduled day. |
| **Health Connect Integration** | Reads steps, heart-rate, sleep (with explicit user consent & KVKK compliance). |
| **Secure Video Library** | HD exercise demonstrations streamed from **AWS S3** via pre-signed URLs. |
| **Real-time Chat** | Socket.io-powered messaging for patient-trainer support. |
| **Notifications** | Firebase Cloud Messaging for session reminders & milestone achievements. |
| **Group System** | Join/leave groups; admins approve requests & broadcast announcements. |
| **Dark / Light Themes** | Fully dynamic theming with smooth modal transitions. |

---

## Tech Stack & Architecture
  ### Frontend
  - Typescript
  - React Native
  - Nativewind
  - Async Storage
  - Health Connect and Health Kit

 ### Backend
 - Java
 - Spring Boot
 - PostgreSQL
 - AWS Cloud EC2 and S3
 - Socket.io
 - Firebase

## Repositories
| Layer    | Repo |
|----------|------|
| **Mobile (React Native)** | _this repo_ |
| **Backend (Spring Boot)** | [health-and-exercise-app-backend](https://github.com/erayfazilordanuc/health-and-exercise-app-backend) |


## App Images

<img width="1280" height="720" alt="Introduction" src="https://github.com/user-attachments/assets/28db542b-5f96-4c49-bfa7-675d92df81e3" /> <br><br>
<img width="1280" height="720" alt="Themes" src="https://github.com/user-attachments/assets/86b291b6-df12-43b7-9cdb-83f2af19ad86" /> <br>

### User Module

<img src="https://github.com/user-attachments/assets/ce837b02-87fa-4cc1-8c5c-8c51ec6146de" width="200" />
<img src="https://github.com/user-attachments/assets/67cdce0c-d7d8-47eb-a566-ff0ee4e60889" width="200" />
<img src="https://github.com/user-attachments/assets/c9ab0abb-9d53-4477-b695-f124f5c51f4d" width="200" />
<img src="https://github.com/user-attachments/assets/58bd1930-a120-4b07-a9e4-7292d8ea39c9" width="200" />
<img src="https://github.com/user-attachments/assets/a048e211-e8ed-4d2b-bbbf-138790d092bc" width="200" />

<br>
<img src="https://github.com/user-attachments/assets/f149ff27-562e-4867-9b7e-a64bb55d3f71" width="200" />
<br>
<img src="https://github.com/user-attachments/assets/ecff253c-485f-44e7-8bf2-5fef0877833b" width="200" />
<img width="200" alt="chat_patient" src="https://github.com/user-attachments/assets/ee4fce5d-e39d-444a-93da-c741a06f9345" /> <br>

### Admin Module

<img src="https://github.com/user-attachments/assets/31585c97-8072-47b1-baa9-5515ee27493e" width="200" />
<img width="200"  alt="member" src="https://github.com/user-attachments/assets/83d14f58-abaa-4192-ad76-a981c57a5b23" />
<img src="https://github.com/user-attachments/assets/49218cc9-a6a2-4921-af2f-18bccbcb2684" width="200" />
<img src="https://github.com/user-attachments/assets/d79eb2d3-c6da-451f-902b-bb79635666b8" width="200" />
<img src="https://github.com/user-attachments/assets/0eb8b688-5ef6-4907-9fe8-f73599dbc416" width="200" />
<img src="https://github.com/user-attachments/assets/a372ee7f-3faa-44b4-8386-ce5ce4099a58" width="200" />




