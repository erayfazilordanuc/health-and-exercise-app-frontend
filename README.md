# 🏃‍♂️ Health & Exercise Tracker

> **A patient-centred mobile app that combines personalised exercise plans, real-time progress tracking, and Health Connect data to make staying healthy effortless.**  
> Built with **React Native (TypeScript)** on the front-end and **Spring Boot (Java)** + **PostgreSQL** on the back-end.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](#license)
![Platform](https://img.shields.io/badge/platform-ios%20%7C%20android-lightgrey)
![Made with](https://img.shields.io/badge/❤️-clean%20code-critical)

## Table of Contents
1. [Why this project?](#why-this-project)
2. [Core Features](#core-features)
3. [Tech Stack & Architecture](#tech-stack--architecture)
4. [Screenshots](#screenshots)
5. [Getting Started](#getting-started)
6. [Environment Variables](#environment-variables)
7. [Running the App](#running-the-app)
8. [API Overview](#api-overview)
9. [Contributing](#contributing)
10. [License](#license)

---

## Why this project?
Traditional exercise apps rarely cater to patients who need **doctor-prescribed, low-impact routines** and **fine-grained progress monitoring**.  
This project bridges that gap by offering:

* **Prescription-level scheduling** (e.g. _Mon / Wed / Fri_ workouts with adjustable intensity).
* **Seamless Health Connect sync** for vitals & activity data.
* **Role-based dashboards** for patients, physiotherapists, and admins.

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
  # Frontend
  - Typescript
  - React Native
  - Nativewind
  - Async Storage
  - Health Connect and Health Kit

 # Backend
 - Java
 - Spring Boot
 - PostgreSQL
 - AWS Cloud EC2 and S3
 - Firebase

   
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
