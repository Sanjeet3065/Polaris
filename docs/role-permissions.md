# POLARIS Role-Based Access Control (RBAC) & Permission Policy

## 1. Overview

POLARIS operates under a 3-tier Role-Based Access Control (RBAC) hierarchy designed for Indian Antarctic Research Stations (**Maitri** and **Bharati**):

1. **`ADMIN`** — Full administrative authority, station personnel management, and security audit log inspection.
2. **`OPERATOR`** — Operational station management, telemetry monitoring, equipment diagnostics, inventory updates, alarm triage, and work order tracking.
3. **`VIEWER`** — Read-only observation access for research scientists and external observers. Cannot acknowledge alarms, update inventory, or mutate station state.

---

## 2. Centralized Permission Matrix

| Subsystem / Resource | Action | ADMIN | OPERATOR | VIEWER | Endpoint Enforcement |
|:---|:---|:---:|:---:|:---:|:---|
| **Authentication & Profile** | View Own Profile (`/auth/me`) | ✅ | ✅ | ✅ | `authenticate` |
| | Change Own Password | ✅ | ✅ | ✅ | `authenticate` |
| | Refresh Session Token | ✅ | ✅ | ✅ | `POST /auth/refresh` |
| | Sign Out / Revoke Session | ✅ | ✅ | ✅ | `POST /auth/logout` |
| **User Administration** | List Personnel Accounts | ✅ | ❌ | ❌ | `authorize(ADMIN)` |
| | View Single User Profile | ✅ | ❌ | ❌ | `authorize(ADMIN)` |
| | Register New Personnel | ✅ | ❌ | ❌ | `authorize(ADMIN)` |
| | Update Personnel Name/Email | ✅ | ❌ | ❌ | `authorize(ADMIN)` |
| | Change Personnel Role | ✅ | ❌ | ❌ | `authorize(ADMIN)` |
| | Activate / Deactivate Account | ✅ | ❌ | ❌ | `authorize(ADMIN)` |
| | Reset User Password | ✅ | ❌ | ❌ | `authorize(ADMIN)` |
| | View Security Audit Trail | ✅ | ❌ | ❌ | `authorize(ADMIN)` |
| **Station Infrastructure** | View Station Summary | ✅ | ✅ | ✅ | `authenticate` |
| | View Environmental Sensors | ✅ | ✅ | ✅ | `authenticate` |
| | View Energy & Microgrid | ✅ | ✅ | ✅ | `authenticate` |
| | View Equipment Roster | ✅ | ✅ | ✅ | `authenticate` |
| | View Real-Time Telemetry | ✅ | ✅ | ✅ | `authenticate` |
| **Operational Workflow** | View Active Station Alarms | ✅ | ✅ | ✅ | `authenticate` |
| | Acknowledge Station Alarms | ✅ | ✅ | ❌ | `authorize(ADMIN, OPERATOR)` |
| | View Station Logistics Inventory | ✅ | ✅ | ✅ | `authenticate` |
| | Update Inventory Quantities | ✅ | ✅ | ❌ | `authorize(ADMIN, OPERATOR)` |
| | View Maintenance Work Orders | ✅ | ✅ | ✅ | `authenticate` |
| | Create/Update Work Orders | ✅ | ✅ | ❌ | `authorize(ADMIN, OPERATOR)` |

---

## 3. Administrative Safeguards & Safety Invariants

To prevent catastrophic administrative lockout in remote polar bases, the system enforces three critical runtime invariants:

1. **Last Active Administrator Protection (Deactivation)**:
   - If only one user has `role: "ADMIN"` and `isActive: true`, attempting to deactivate that user is rejected with `409 Conflict`.
   - Error: `"Cannot deactivate the only remaining active administrator."`

2. **Last Active Administrator Protection (Demotion)**:
   - If only one user has `role: "ADMIN"` and `isActive: true`, attempting to change their role to `OPERATOR` or `VIEWER` is rejected with `409 Conflict`.
   - Error: `"Cannot demote the only remaining active administrator."`

3. **Self-Deactivation Prevention**:
   - An administrator cannot disable their own active account.
   - Error: `"Administrators cannot deactivate their own active account."` (HTTP `400 Bad Request`).

---

## 4. Middleware Implementation

### 4.1 Authentication Middleware (`authenticate.ts`)
```typescript
import { Request, Response, NextFunction } from "express";
import { tokenService } from "../services/token.service";
import { userRepository } from "../repositories/user.repository";
import { ApiError } from "../types";

export const authenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw ApiError.unauthorized("Authentication required: Missing or invalid Bearer token");
  }

  const token = authHeader.substring(7);
  const payload = tokenService.verifyAccessToken(token);

  const user = await userRepository.findById(payload.sub);
  if (!user || !user.isActive) {
    throw ApiError.forbidden("Account is deactivated or does not exist");
  }

  req.user = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  };

  next();
};
```

### 4.2 Centralized Authorization Middleware (`authorize.ts`)
```typescript
import { Request, Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";
import { ApiError } from "../types";

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw ApiError.unauthorized("Authentication required");
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw ApiError.forbidden(
        `Insufficient security clearance. Required: [${allowedRoles.join(", ")}], Current: ${req.user.role}`
      );
    }

    next();
  };
};
```

---

## 5. Frontend Clearance Routing (`ProtectedRoute.tsx`)

In the React frontend, routes enforce RBAC through the `<ProtectedRoute />` component:
- **Unauthenticated**: Redirects to `/login` preserving intended destination in state.
- **Authenticated with insufficient role**: Renders a dedicated polar **Restricted Security Clearance** notice with required classification and a button to return safely to `/overview`.
- **Authenticated with required role**: Renders the requested view seamlessly.
