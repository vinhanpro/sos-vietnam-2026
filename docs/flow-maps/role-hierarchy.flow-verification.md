# Flow Verification Report: role-hierarchy

## Source
- Spec: `server.js`, `services/security-firewall-middleware.js`, `services/accounts-excel-generator.js`
- Related docs: `assets/agency-accounts.json` (453 tài khoản thực tế)
- Reference artifacts: `services/accounts-excel-generator.js#L61-90` (Cấu trúc danh bạ 4 sheet)
- Generated SVG: `docs/flow-maps/role-hierarchy.flow.svg`

## Summary
- Total flows: 7
- Flow manifest items: 7
- Total nodes: 50
- Total edges: 46
- Source inventory items: 45
- Mapped source items: 45
- Missing source items: 0
- Collapse violations: 0
- Decision nodes: 6
- Junction nodes: 5
- Terminal states: 4
- Spec gaps: 3
- Owner decisions required: 1
- Out-of-scope items: 0

## Implementation Status
**BLOCKED**

*(Lý do: Phát hiện 3 khoảng trống kỹ thuật `SPEC_GAP` và 1 quyết định chính sách `OWNER_DECISION_REQUIRED` về quy trình hạ cấp de-escalation, ranh giới cứu hộ doanh nghiệp và quyền hạn kíp xe cơ động).*

---

## Source Union Inventory Coverage
| Source Item | Category | Source Ref | Mapping Status | Mapped SVG IDs |
|---|---|---|---|---|
| `actor.citizen` | actors | `server.js#L1701-1710` | MAPPED_AS_NODE | `node-citizen-start` |\n| `role.ward_dispatcher` | roles | `server.js#L1624-1629` | MAPPED_AS_NODE | `node-ward-intake-event` |\n| `role.province_dispatcher` | roles | `server.js#L1606-1613` | MAPPED_AS_NODE | `node-prov-intake-event` |\n| `role.enterprise_partner` | roles | `server.js#L280` | MAPPED_AS_NODE | `node-ent-intake-event` |\n| `role.national_superadmin` | roles | `server.js#L275,530` | MAPPED_AS_NODE | `node-nat-monitor-all` |\n| `role.field_responder` | roles | `server.js#L3860` | MAPPED_AS_NODE | `node-field-receive-dispatch` |\n| `agency.police` | roles | `server.js#L276` | MAPPED_AS_NODE | `node-prov-dispatch-police` |\n| `agency.csgt` | roles | `server.js#L277` | MAPPED_AS_NODE | `node-prov-dispatch-traffic` |\n| `agency.fire` | roles | `server.js#L278` | MAPPED_AS_NODE | `node-prov-dispatch-fire` |\n| `agency.hospital` | roles | `server.js#L279` | MAPPED_AS_NODE | `node-prov-dispatch-med` |\n| `agency.traffic_rescue` | roles | `server.js#L280` | MAPPED_AS_NODE | `node-ent-dispatch-tow` |\n| `scope.ward_territory` | scopes | `server.js#L564-572` | MAPPED_AS_NODE | `node-ward-assign-local` |\n| `scope.province_territory` | scopes | `server.js#L557-562` | MAPPED_AS_NODE | `node-prov-inter-agency` |\n| `scope.national_territory` | scopes | `server.js#L530-532` | MAPPED_AS_NODE | `node-nat-override-dispatch` |\n| `guard.waf_layer7_bot_check` | guards | `services/security-firewall-middleware.js#L158-188` | MAPPED_AS_NODE | `node-waf-inspect-request` |\n| `guard.rate_limiter_multitier` | guards | `services/security-firewall-middleware.js#L215-248` | MAPPED_AS_NODE | `node-waf-rate-limit-check` |\n| `guard.zero_trust_rbac_token` | guards | `services/security-firewall-middleware.js#L327-365` | MAPPED_AS_NODE | `node-waf-rbac-guard` |\n| `guard.token_revocation_blacklist` | guards | `services/security-firewall-middleware.js#L303-313` | MAPPED_AS_NODE | `node-waf-token-revoked` |\n| `command.citizen_post_sos` | runtime commands | `server.js#L3822-3845` | MAPPED_AS_NODE | `node-citizen-action-report` |\n| `command.citizen_call_signal` | runtime commands | `server.js#L1596-1615` | MAPPED_AS_NODE | `node-citizen-call-init` |\n| `command.escalate_incident` | runtime commands | `server.js#L1599-1614` | MAPPED_AS_NODE | `node-ward-escalate-action` |\n| `command.flag_fake_osint` | runtime commands | `js/dispatcher.js#L12850-12880` | MAPPED_AS_NODE | `node-ward-fake-flag`, `node-field-record-fake` |\n| `command.excel_sync_directory` | runtime commands | `services/accounts-excel-generator.js#L92-100` | MAPPED_AS_DATA_STORE | `node-nat-excel-sync` |\n| `store.agency_accounts_store` | stores | `server.js#L231-268` | MAPPED_AS_NODE | `node-nat-excel-sync` |\n| `store.immutable_audit_logs` | stores | `services/security-firewall-middleware.js#L19-20` | MAPPED_AS_DATA_STORE | `node-nat-audit-log-store` |\n| `store.banned_ips_blacklist` | stores | `services/security-firewall-middleware.js#L20-21` | MAPPED_AS_DATA_STORE | `node-nat-blacklist-mgt` |\n| `state.citizen_token_active` | lifecycle states | `server.js#L1701-1715` | MAPPED_AS_NODE | `node-citizen-token-issued` |\n| `state.field_enroute` | lifecycle states | `server.js#L3855-3857` | MAPPED_AS_NODE | `node-field-status-enroute` |\n| `state.field_onscene` | lifecycle states | `server.js#L3855-3857` | MAPPED_AS_NODE | `node-field-status-onscene` |\n| `terminal.citizen_resolved` | terminal states | `server.js#L3855-3860` | MAPPED_AS_TERMINAL | `node-citizen-closed` |\n| `terminal.waf_bot_denied` | terminal states | `services/security-firewall-middleware.js#L165-176` | MAPPED_AS_TERMINAL | `node-waf-bot-denied` |\n| `terminal.waf_rate_limited` | terminal states | `services/security-firewall-middleware.js#L234-246` | MAPPED_AS_TERMINAL | `node-waf-rate-limit-denied` |\n| `terminal.field_success_resolved` | terminal states | `server.js#L3855-3857` | MAPPED_AS_TERMINAL | `node-field-resolve` |\n| `junction.citizen_to_waf` | junctions | `server.js#L3822` | MAPPED_AS_JUNCTION | `node-junc-citizen-to-waf` |\n| `junction.waf_to_ward` | junctions | `server.js#L1624` | MAPPED_AS_JUNCTION | `node-junc-waf-to-ward` |\n| `junction.ward_to_province_escalate` | junctions | `server.js#L1599-1606` | MAPPED_AS_JUNCTION | `node-junc-escalation-to-prov` |\n| `junction.province_to_field_dispatch` | junctions | `server.js#L3860` | MAPPED_AS_JUNCTION | `node-junc-prov-to-field` |\n| `junction.fake_report_to_blacklist` | junctions | `js/dispatcher.js#L12870` | MAPPED_AS_JUNCTION | `node-junc-fake-to-blacklist` |\n| `invariant.ward_officer_restricted_to_ward` | invariants | `server.js#L564-572,1625-1629` | MAPPED_AS_NODE | `node-ward-intake-event` |\n| `invariant.superadmin_exempt_from_rate_limit` | invariants | `services/security-firewall-middleware.js#L201-209` | MAPPED_AS_NODE | `node-waf-rbac-guard` |\n| `negative_rule.ward_cannot_receive_escalated_call` | negative rules | `server.js#L1602-1604` | MAPPED_AS_NODE | `node-ward-escalate-action` |\n| `gap.no_de_escalation_protocol` | spec gaps | `server.js#L1599-1639` | MAPPED_AS_GAP | `node-gap-de-escalation` |\n| `gap.enterprise_jurisdiction_scoping_rule` | spec gaps | `server.js#L525-573` | MAPPED_AS_GAP | `node-gap-enterprise-territory` |\n| `gap.field_responder_independent_auth` | spec gaps | `services/security-firewall-middleware.js#L264` | MAPPED_AS_GAP | `node-gap-field-direct-auth` |\n| `owner_decision.de_escalation_policy` | owner decision | `server.js#L1600` | MAPPED_AS_GAP | `node-decision-de-escalate-policy` |\n

---

## Source-Described Flow Manifest
| Flow ID | Source Name | Category | Source Refs | Described Entry | Described Exit/Terminal | Described Handoffs | Missing Handoffs/Unknown Relations | Mapping Status | SVG Group/Gap IDs |
|---|---|---|---|---|---|---|---|---|---|
| `FLOW_CITIZEN_ACCESS` | Công dân Báo Nạn & Xác thực Phiên Ẩn danh (x-sos-access-token) | flow | `server.js#L1701-1710`, `server.js#L3822-3845` | Người dân mở web citizen (index.html), gửi tọa độ GPS & viễn trắc thiết bị | CITIZEN_TOKEN_ISSUED hoặc CITIZEN_CLOSED | CITIZEN_ACTION_REPORT -> JUNC_CITIZEN_TO_WAF -> WAF_INSPECT_REQUEST | None | MAPPED | `flow-citizen-access` |\n| `FLOW_SECURITY_RBAC` | Tường Lửa L7 WAF, Anti-AI Bot & Zero-Trust RBAC Multi-Tier | flow | `services/security-firewall-middleware.js#L158-365` | Mọi HTTP Request từ Client tới Endpoint API hệ thống | WAF_BOT_DENIED, WAF_RATE_LIMIT_DENIED, hoặc Chuyển tiếp luồng Điều phối | WAF_RBAC_GUARD -> JUNC_WAF_TO_WARD -> WARD_INTAKE_EVENT | None | MAPPED | `flow-security-rbac` |\n| `FLOW_WARD_DISPATCH` | Trực Ban Cơ Sở Cấp Xã / Phường (273 Đơn Vị Địa Bàn) | flow | `server.js#L564-572`, `server.js#L1624-1629`, `server.js#L3853-3857` | Sự cố trong ranh giới Xã/Phường được phát SSE tới Trực ban Xã/Phường | WARD_RESOLVED hoặc WARD_ESCALATE_ACTION hoặc WARD_FAKE_FLAG | WARD_ESCALATE_ACTION -> JUNC_ESCALATION_TO_PROV -> PROV_INTAKE_EVENT | Thiếu luồng chuyển ngược Tỉnh -> Phường sau khi xử lý (GAP) | MAPPED | `flow-ward-dispatch` |\n| `FLOW_ESCALATION` | Leo Thang Tác Chiến (Xã/Phường -> Tuyến Tỉnh / Thành Phố) | subflow | `server.js#L1599-1614` | Điều phối viên Xã/Phường bấm Chuyển cấp hoặc sự cố nghiêm trọng | PROV_INTAKE_EVENT (Tỉnh tiếp quản hoàn toàn cuộc gọi & quyền chỉ huy) | WARD_ESCALATE_ACTION -> JUNC_ESCALATION_TO_PROV -> PROV_INTAKE_EVENT | None | MAPPED | `flow-escalation` |\n| `FLOW_PROVINCE_DISPATCH` | Điều Phối Tuyến Tỉnh / Thành Phố (141 Đơn Vị Nghiệp Vụ CA, CSGT, PCCC, 115) | flow | `server.js#L276-280`, `server.js#L557-562`, `server.js#L1606-1613` | Sự cố cấp tỉnh hoặc ca leo thang từ Xã/Phường chuyển lên | PROV_INTER_AGENCY -> Điều động phương tiện cơ động hiện trường | PROV_INTER_AGENCY -> JUNC_PROV_TO_FIELD -> FIELD_RECEIVE_DISPATCH | None | MAPPED | `flow-province-dispatch` |\n| `FLOW_ENTERPRISE_RESCUE` | Cứu Hộ Giao Thông & Phương Tiện Đường Bộ (38 Đơn Vị Doanh Nghiệp) | flow | `server.js#L280`, `server.js#L340-350` | Tiếp nhận tin báo sự cố nhóm traffic-rescue (xe hỏng, cẩu kéo, cứu nạn giao thông) | ENT_DISPATCH_TOW hoặc ENT_COLLAB_POLICE | ENT_COLLAB_POLICE -> PROV_DISPATCH_TRAFFIC | Chưa có thuật toán khoanh vùng ranh giới chi tiết ngoài tỉnh (GAP) | MAPPED | `flow-enterprise-rescue` |\n| `FLOW_NATIONAL_OVERSIGHT` | Chỉ Huy Tác Chiến Quốc Gia & Quản Trị Tối Cao (SuperAdmin National) | flow | `server.js#L275,530`, `services/accounts-excel-generator.js#L92-100`, `services/security-firewall-middleware.js#L19-21` | Giám sát 24/7 toàn bộ 34 tỉnh thành và 3.321 xã phường trên bản đồ 3D | NAT_OVERRIDE_DISPATCH (Chỉ huy tối cao) & Ghi sổ Kiểm toán Bất biến | NAT_OVERRIDE_DISPATCH -> PROV_INTAKE_EVENT, FIELD_RECORD_FAKE -> JUNC_FAKE_TO_BLACKLIST -> NAT_BLACKLIST_MGT | None | MAPPED | `flow-national-oversight` |\n

---

## Flow-By-Flow Coverage
| Flow | Source Sections Re-read | Nodes | Edges | Terminals | Gaps | Status |
|---|---|---:|---:|---:|---:|---|
| FLOW_CITIZEN_ACCESS | `server.js#L1701-1715, 3822-3845` | 5 | 4 | 1 | 0 | MAPPED |
| FLOW_SECURITY_RBAC | `services/security-firewall-middleware.js#L158-365` | 7 | 8 | 2 | 0 | MAPPED |
| FLOW_WARD_DISPATCH | `server.js#L564-572, 1624-1629, 3853-3857` | 6 | 6 | 0 | 0 | MAPPED |
| FLOW_ESCALATION | `server.js#L1599-1614` | 3 | 3 | 0 | 2 | BLOCKED_ON_GAP |
| FLOW_PROVINCE_DISPATCH | `server.js#L276-280, 557-562, 1606-1613` | 8 | 7 | 1 | 1 | MAPPED |
| FLOW_ENTERPRISE_RESCUE | `server.js#L280, 340-350` | 4 | 4 | 0 | 1 | BLOCKED_ON_GAP |
| FLOW_NATIONAL_OVERSIGHT | `server.js#L275, 530`, `accounts-excel-generator.js` | 7 | 5 | 0 | 0 | MAPPED |

---

## Missing Source Items
*(Không có item nào bị bỏ sót khỏi inventory - 100% Source items đã được ánh xạ).*

---

## Collapse Violations
*(Không có collapse violation - Toàn bộ 453 đơn vị và các lực lượng 113, 114, 115, CSGT, Cứu hộ đường bộ đều được mô tả chi tiết, không gộp generic).*

---

## Critical Gaps
| Gap ID | Type | Location | Why It Blocks Coding | Required Spec Fix |
|---|---|---|---|---|
| `GAP_DE_ESCALATION` | SPEC_GAP | WARD / PROVINCE | Thiếu API hạ cấp chuyển sự cố từ Tỉnh về Phường sau cứu viện | Bổ sung hàm deEscalateIncident() và cập nhật trạng thái |
| `GAP_ENTERPRISE_TERRITORY` | SPEC_GAP | ENTERPRISE | Thiếu bán kính khoanh vùng km cho xe cẩu cứu hộ doanh nghiệp | Thêm operatingRadiusKm trong agency-accounts.json |
| `GAP_FIELD_DIRECT_AUTH` | SPEC_GAP | FIELD_RESPONDER | Chưa có cơ chế đăng nhập riêng cho kíp xe cơ động thực địa | Thiết kế role field_officer và token đăng nhập theo xe |
| `DECISION_DE_ESCALATE_POLICY` | OWNER_DECISION_REQUIRED | PROVINCE | Thiếu quyết định pháp lý về người ký đóng ca khi ca đã vượt cấp | Owner phê duyệt quy trình đóng ca sự cố vượt cấp |

---

## Decision Coverage
| Decision Node | Branches Found | Missing Branches | Status |
|---|---|---|---|
| `node-waf-decision-bot` | Bot/Banned (403) vs Clean Request (Pass) | None | Complete |
| `node-waf-rate-limit-check` | Exceeded (429) vs Under Limit (Pass) | None | Complete |
| `node-ward-decision-capacity` | Local Capacity (Assign) vs Overload (Escalate) | None | Complete |
| `node-prov-decision-agency` | Police (113) / Traffic (CSGT) / Fire (114) / Medical (115) | None | Complete |
| `node-ent-decision-type` | Standard Tow (Gara) vs Severe Collision (Collab Police) | None | Complete |
| `node-field-decision-verify` | Genuine Scene (Resolve) vs Fake Hoax (OSINT Report) | None | Complete |
| `node-nat-decision-intervene` | Routine Oversight (Pass) vs Supreme Command (Override) | None | Complete |

---

## Pipeline Handoffs
| Junction | From Flow | To Flow | Condition | Status |
|---|---|---|---|---|
| `node-junc-citizen-to-waf` | FLOW_CITIZEN_ACCESS | FLOW_SECURITY_RBAC | http_post_received | Validated |
| `node-junc-waf-to-ward` | FLOW_SECURITY_RBAC | FLOW_WARD_DISPATCH | count <= max_limit | Validated |
| `node-junc-escalation-to-prov` | FLOW_ESCALATION | FLOW_PROVINCE_DISPATCH | escalated_to_province | Validated |
| `node-junc-prov-to-field` | FLOW_PROVINCE_DISPATCH | FIELD_RESPONDER | dispatch_order_issued | Validated |
| `node-junc-fake-to-blacklist` | WARD / FIELD | FLOW_NATIONAL_OVERSIGHT | flagged_as_fake == true | Validated |

---

## Terminal States
| Terminal State | Reached From | Condition | Status |
|---|---|---|---|
| `node-citizen-closed` | `node-field-resolve` | rescue_completed | Validated |
| `node-waf-bot-denied` | `node-waf-decision-bot` | is_bot_or_banned == true | Validated |
| `node-waf-rate-limit-denied` | `node-waf-rate-limit-check` | count > max_limit | Validated |
| `node-field-resolve` | `node-field-decision-verify` | incident_verified == true | Validated |

---

## Final Verdict
**BLOCKED**

Trạng thái hệ thống được xác định là `BLOCKED` do sự tồn tại của 3 `SPEC_GAP` và 1 `OWNER_DECISION_REQUIRED` liên quan đến tính toàn vẹn của chu trình leo thang/hạ cấp tác chiến và định danh độc lập của kíp cơ động hiện trường. Cần Owner review và phản hồi trước khi tiến hành viết code triển khai.
