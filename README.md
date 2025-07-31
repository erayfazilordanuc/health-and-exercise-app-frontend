# 🏃‍♂️ Health & Exercise Tracker

> **A patient-focused mobile app that brings live Health Connect/HealthKit tracking, a weekly exercise calendar, and nurse chat together—plus an admin panel for managing workouts and monitoring patient progress.**  

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Platform](https://img.shields.io/badge/platform-ios%20%7C%20android-lightgrey)
![Made with](https://img.shields.io/badge/❤️-clean%20code-critical)

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
### User Module
<img src="https://github.com/user-attachments/assets/0212ace4-e755-41fa-aa47-2e7af36ac769" width="200" />
<img src="https://github.com/user-attachments/assets/fe1c89c2-986c-497a-8b34-96af84b20dde" width="200" />
<img src="https://github.com/user-attachments/assets/3f00d5c7-d0b2-40cb-985b-b789c4d1f439" width="200" />
<img src="https://github.com/user-attachments/assets/4158aaf1-0b72-4ddf-9082-82c9b6a13ffc" width="200" />
<img src="https://github.com/user-attachments/assets/1a0f8cf6-2b4e-499b-ad68-c9c114c87711" width="200" />

### Admin Module
<img src="https://github.com/user-attachments/assets/11a37875-b9ab-4215-afec-1b7d215edfa9" width="200" />
<img src="https://github.com/user-attachments/assets/01852a36-b375-4b28-87e5-50851821ae9c" width="200" />
<img src="https://github.com/user-attachments/assets/5ddb6aad-7f2a-47db-b3d0-65ba76429468" width="200" />
<img src="https://github.com/user-attachments/assets/6651198c-81c0-4669-9996-bfdf47645994" width="200" />
<img src="https://github.com/user-attachments/assets/bfba83c9-f1f0-4b41-8c73-1a5404941e58" width="200" />
