# CLMS API Reference

Base URL: `/api`. All endpoints except `POST /auth/*` and
`GET /certificates/:id/verify` require a `Bearer` access token. Role
restrictions are enforced by `RolesGuard`.

## Auth
| Method | Path | Notes |
| --- | --- | --- |
| POST | `/auth/register` | Create user, returns access + refresh tokens |
| POST | `/auth/login` | Returns access + refresh tokens |
| POST | `/auth/refresh` | Rotate tokens |
| GET | `/auth/me` | Current user |

## Users
| GET | `/users` | Admin/Director/QM |
| GET | `/users/:id` | |
| PATCH | `/users/:id/role` | Super Admin |
| PATCH | `/users/:id/active` | Super Admin |

## Customers / Instruments
| GET/POST | `/customers` · `/customers/:id` | search via `?search=` |
| GET/POST | `/instruments` · `/instruments/:id` | filter via `?customerId=` |

## Jobs (calibration workflow)
| POST | `/jobs` | Create (status RECEIVED) |
| GET | `/jobs?status=` | List/filter |
| GET | `/jobs/:id` | Detail with datasheets + certificate |
| PATCH | `/jobs/:id/assign` | Assign engineer |
| PATCH | `/jobs/:id/status` | Validated status transition |

## Datasheets (formula + uncertainty engines)
| POST | `/datasheets` | Versioned datasheet with observations |
| GET | `/datasheets/:id` | |
| POST | `/datasheets/:id/recalculate` | Apply column formulas |
| POST | `/datasheets/:id/uncertainty` | Compute + persist uncertainty budget |

## Certificates (QR + digital signatures)
| POST | `/certificates/generate` | From an APPROVED job |
| POST | `/certificates/:id/sign` | Ordered signature workflow |
| GET | `/certificates/:id` | |
| GET | `/certificates/:id/verify` | **Public** QR verification |

## Reports
| GET | `/reports/certificate/:id.html` | HTML/PDF-ready certificate |

## Engineers / Tasks / Dashboard
| GET/POST | `/engineers` | |
| POST | `/tasks` · GET `/tasks/board` · PATCH `/tasks/:id/status` | Kanban |
| GET | `/dashboard` | Aggregated widgets |

## Billing / Inventory
| POST/GET | `/billing/invoices` · POST `/billing/invoices/:id/payments` | GST + payments |
| POST/GET | `/inventory/items` · PATCH `/inventory/items/:id/stock` | |

## Quality / Environmental / Notifications / Audit
| POST/GET | `/quality/ncr` · POST `/quality/ncr/:id/capa` · PATCH `/quality/ncr/:id/close` | |
| POST/GET | `/environmental` | Limit-breach alerts on POST |
| GET | `/notifications` · PATCH `/notifications/:id/read` | |
| GET | `/audit` | Admin/QM/Auditor, read-only |

## Customer Portal (role CUSTOMER)
| GET | `/portal/jobs` · `/portal/certificates` · `/portal/invoices` | Customer-scoped |
| POST | `/portal/requests` · `/portal/complaints` | |
