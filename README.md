# Employee Service Request System

A full-stack internal service request portal that allows employees to raise IT, HR, and Facility requests while enabling managers and administrators to assign requests, update statuses, monitor SLA deadlines, and review request activity.

## Project Overview

The Employee Service Request System is designed to improve the way internal employee service requests are submitted, tracked, assigned, and resolved.

The system provides:

- Employee service request creation
- Request tracking
- Role-based access control
- Manager request management
- Request assignment
- Request status updates
- SLA deadline calculation
- Overdue request identification
- Request activity/audit history
- Input validation and error handling
- JWT-based authentication
- Relational database storage
- Production deployment

## Problem Statement

Employees need a structured way to report internal IT, HR, and facility-related issues.

Without a centralized system, requests can be difficult to track, assign, prioritize, and monitor.

This project provides a centralized workflow where:

1. Employees submit service requests.
2. Requests receive a priority and SLA deadline.
3. Managers review incoming requests.
4. Managers assign requests to users.
5. Request status is updated throughout the workflow.
6. Activity history is recorded for traceability.

## Objectives

- Provide a centralized service request portal.
- Reduce manual request tracking.
- Support role-based access.
- Improve visibility of request status.
- Track SLA deadlines.
- Maintain an audit-friendly activity history.
- Validate user input and handle invalid requests safely.
- Provide a deployment-ready full-stack application.

## User Roles

### Employee

Employees can:

- Register and log in.
- Create service requests.
- Select request category.
- Select request priority.
- View their submitted requests.
- Track request status.
- View SLA information.

### Manager

Managers can:

- Log in securely.
- View service requests.
- View employee request information.
- Assign requests.
- Update request status.
- Add comments to status updates.
- View request activity history.
- Monitor SLA information.

### Admin

The database and authorization model also support an administrator role for privileged system access.

## Main Request Categories

The system supports:

- IT
- HR
- Facility

## Priority Levels and SLA

| Priority | SLA |
|----------|-----|
| Low | 48 hours |
| Medium | 24 hours |
| High | 8 hours |
| Critical | 4 hours |

The SLA deadline is calculated when a request is created.

## Request Status Workflow

# text

Open
  ↓
Assigned
  ↓
In Progress
  ↓
Resolved
  ↓
Closed