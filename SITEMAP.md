# SRE Agent Mockup — Interaction Sitemap

## Navigation Structure

```
/ (Home/Dashboard)
├── /memory (Memory Explorer)
├── /integrations (Integrations Hub)
├── /analytics (Analytics Dashboard)
├── /settings (Settings — Config + Memory Admin)
├── /setup (Setup Wizard)
└── /investigation/:id (Investigation Canvas)
    ├── /investigation/:id/golden-metrics
    ├── /investigation/:id/slo
    ├── /investigation/:id/war-room
    └── /investigation/:id/postmortem
```

## Page-by-Page Interaction Map

### 1. Home (`/`)
| Element | Action | Result |
|---------|--------|--------|
| Morning Brief toggle | Click | Expand/collapse brief |
| "Connect GitHub" nudge | Click button | Navigate → `/integrations`, hide nudge |
| "X" dismiss nudge | Click | Hide nudge |
| Active Investigation card | Click | Navigate → `/investigation/:id` |
| "New Investigation" button | Click | Open NewInvestigationModal |
| Recent Investigation row | Click | Navigate → `/investigation/:id` |
| Quick Stats cards | Display only | No interaction |
| Getting Started checklist (incomplete) | Click | Navigate → linked page |

### 2. Investigation Canvas (`/investigation/:id`)

#### Left Sidebar
| Element | Action | Result |
|---------|--------|--------|
| Timeline entry | Display | Shows time, event, source, provenance badge |
| "Show N more" timeline | Click | Expand/collapse remaining entries |
| Data Source pill | Click | Expand → shows pulled data items + "View in X →" link |
| "View in X →" link | Click | **TOAST**: "Opening in {source}" |
| Active Memory toggle | Click | Enable/disable memory for session |
| "Include memory..." | Click | Open search panel |
| Memory search result "Add" | Click | Add to active list |
| Memory search result "Pin" | Click | Add to pinned section |
| "Pull from entity..." | Click | Show entity chips to pull from |
| Entity chip | Click | Load memories from that entity + toast |
| "Save to Mine" (learning) | Click | Toast: "Saved to My Knowledge" |
| "Propose to Team" (learning) | Click | Toast: "Proposed to Team" |
| Context Details toggle | Click | Expand/collapse entity, changes, slack |
| Related Entities | Display only | Health dots + names |

#### Center Canvas
| Element | Action | Result |
|---------|--------|--------|
| Alert Context Header | Display | Shows entity, severity, phase, impact line |
| CompactContextStrip "Details →" (metrics) | Click | Navigate → `/investigation/:id/golden-metrics` |
| CompactContextStrip "Details →" (SLO) | Click | Navigate → `/investigation/:id/slo` |
| Hypothesis card | Click header | Expand/collapse |
| "Expand evidence" | Click | Show evidence panel with data |
| "Skip" button | Click | Mark hypothesis as skipped |
| "Prioritize" button | Click | Move hypothesis up priority |
| "Disagree" button | Click | Open disagree form |
| Disagree → "Submit" | Click | Submit disagreement, show re-investigation banner |
| "Add Context" button | Click | Open context form |
| Context → "Add Context" | Click | Submit context, show context display |
| "Undo skip" | Click | Restore skipped hypothesis |
| Tabs (Cards/Tree) | Click | Switch between card view and reasoning tree |
| Tree zoom controls | Click | Zoom in/out/reset |
| Tree "Export" | Click | Inline label change: "Exported as PNG" |
| Tree "Fullscreen" | Click | Toggle fullscreen mode |
| Tree "Replay" | Click | Replay animation |
| RCA expand/collapse | Click | Toggle full analysis |
| Suggestion card "Accept" | Click | Show accepted state + command preview |
| Suggestion card "Preview" | Click | Toggle command/config preview |
| Suggestion card "Dismiss" | Click | Gray out with "Undo" option |
| Dismissed → "Undo" | Click | Restore suggestion |
| Accepted → copy button | Click | Copy command to clipboard + toast |
| "Notify Team" | Click | Toast: "Team notified" |
| "Create Ticket" | Click | Toast: "Ticket created" |
| "Execute Runbook" | Click | Toast: "Runbook opened" |
| "Rollback" | Click | Toast: "Rollback initiated" |
| "War Room" | Click | Toast + Navigate → `/investigation/:id/war-room` |
| "Save to Memory" | Click | Toast + Navigate → `/memory` |
| "Post-Mortem" | Click | Toast + Navigate → `/investigation/:id/postmortem` |

#### Right Chat Panel
| Element | Action | Result |
|---------|--------|--------|
| AI autonomy indicator | Display | Shows mode based on severity |
| Suggested chip | Click | Send as message |
| Text input + Send | Click/Enter | Send message, get AI response |
| Guided step indicator | Display | Shows "Step N of 10" |
| AI response | Display | Scrolls canvas to relevant section |

### 3. Golden Metrics (`/investigation/:id/golden-metrics`)
| Element | Action | Result |
|---------|--------|--------|
| InvestigationSubNav | Click tab | Navigate between sub-pages |
| Time range tabs (1h/6h/24h/7d) | Click | Change chart time range |
| "Incident Window" | Click | Toast: "Incident window highlighted" |
| Show/hide toggles (deploy/anomaly/annotations) | Click | Toggle chart overlays |
| Compare mode toggle | Click | Toggle comparison view |
| Chart brush | Drag | Zoom into time range |
| "Screenshot" | Click | Toast: "Screenshot captured" |
| "Export CSV" | Click | Toast: "CSV exported" |
| "Add to Post-Mortem" | Click | Toast: "Added to Post-Mortem" |
| "Share Link" | Click | Toast: "Link copied to clipboard" |

### 4. SLO Workflow (`/investigation/:id/slo`)
| Element | Action | Result |
|---------|--------|--------|
| InvestigationSubNav | Click tab | Navigate between sub-pages |
| Budget bar | Animated | Shows budget remaining |
| Heatmap day | Hover | Tooltip: "Day N: status" |
| "Freeze Deployments" | Click | Toast: "Freeze Deployments" |
| "Request Additional Budget" | Click | Toast: "Budget Exception Requested" |
| "Generate Compliance Report" | Click | Toast: "Compliance Report Generated" |
| "Create Improvement Ticket" | Click | Toast: "Improvement Ticket Created" |

### 5. War Room (`/investigation/:id/war-room`)
| Element | Action | Result |
|---------|--------|--------|
| "Open War Room" (empty state) | Click | Activate war room + toast |
| "Back to Canvas" | Click | Navigate → `/investigation/:id` |
| "Invite +" | Click | Toast: "Invitation sent" |
| "End War Room" | Click | Deactivate + toast |
| Feed filter tabs | Click | Filter live feed |
| Feed entry bookmark star | Click | Toggle bookmark |
| "Open Full Canvas" | Click | Navigate → `/investigation/:id` |
| "Escalate" | Click | Toast: "Escalated" |
| "Rollback" | Click | Toast: "Rollback initiated" |
| "Runbook" | Click | Toast: "Runbook opened" |
| Template buttons | Click | Populate status update textarea |
| Destination checkboxes | Click | Toggle Slack/PD/StatusPage |
| "Send Update" | Click | Toast: "Status update sent" |

### 6. Post-Mortem (`/investigation/:id/postmortem`)
| Element | Action | Result |
|---------|--------|--------|
| "AI Review for Accuracy" | Click | Spinner 2.5s → shows review results |
| Review result "Apply" (suggestion) | Click | Toast: "Suggestion applied" |
| Review results "X" close | Click | Hide review panel |
| Source panel items | Click | Highlight corresponding sections |
| All Textarea fields | Type | Editable content |
| "What Went Well" checkboxes | Click | Toggle |
| "What Went Wrong" checkboxes | Click | Toggle |
| Action item "Create Jira" | Click | Toast: "Jira ticket created: ..." |
| "Create All Action Items" | Click | Toast: "N Jira tickets created" |
| Export buttons (Confluence/Jira/PDF/etc) | Click | Toast: "Exported to {target}" |

### 7. Memory Explorer (`/memory`)

#### Left Sidebar
| Element | Action | Result |
|---------|--------|--------|
| Search input | Type | Switch to search results view |
| Scope buttons (My/Team/Pending) | Click | Switch main content view |
| Entity filter chips | Click | Filter by entity |
| Type filter chips | Click | Filter by auto/manual |
| Status filter chips | Click | Filter by Active/Pending/Stale |
| "Clear filters" | Click | Reset all filters |
| Role toggle (Admin/Standard) | Click | Toggle admin capabilities |
| "Add New" | Click | Open AddNewPanel |
| "Upload / Import" | Click | Open UploadImportPanel |
| "Learning Settings" | Click | Open LearningSettingsPanel |

#### My Knowledge View
| Element | Action | Result |
|---------|--------|--------|
| Sort button | Click | Cycle: Recent/Confidence/Most Used |
| Memory card | Click | Expand to show content + actions |
| "Edit" button | Click | **SHOULD**: Open inline edit mode |
| "Archive" button | Click | Toast: "Archived" |
| "Promote to Team" | Click | Toast: "Submitted for team approval" |
| "Refresh" (stale only) | Click | Toast: "Re-validating..." |

#### Team Knowledge View
| Element | Action | Result |
|---------|--------|--------|
| Domain filter chips | Click | Filter by domain |
| Memory card | Click | Expand to show content + actions |
| "I've seen this too" (non-admin) | Click | Toast: "Confirmed" |
| "Edit" button (admin) | Click | **SHOULD**: Open inline edit mode |
| "Revoke" button (admin) | Click | Toast: "Revoked" |

#### Pending Review View (admin)
| Element | Action | Result |
|---------|--------|--------|
| "Approve" button | Click | Toast: "Approved: {title}" |
| "Reject" button | Click | Toast: "Rejected" |
| "Merge with existing" | Click | Toast: "Merged" |

#### Add New Panel
| Element | Action | Result |
|---------|--------|--------|
| Memory type cards | Click | Select type, show form |
| Visibility cards (me/team) | Click | Select visibility |
| Title input | Type | Editable |
| Content textarea | Type | Editable |
| Entity chips | Click | Select entity |
| Domain chips (team only) | Click | Select domain |
| "Save Memory" / "Submit" | Click | Saving animation → toast → reset |
| "Cancel" | Click | Return to previous view |

#### Upload / Import Panel
| Element | Action | Result |
|---------|--------|--------|
| Paste card → expand | Click | Show paste form |
| Paste → "Save as Memory" | Click | Toast + reset |
| File upload → click/drop | Click | Show mock file preview |
| File → "Import as Memory" | Click | Toast + reset |
| File → "Remove" | Click | Clear file selection |
| Confluence → "Fetch Page" | Click | Loading spinner → show page info |
| Confluence → "Import" | Click | Toast + reset |
| bits.md → click/drop | Click | Toast: "Parsed 8 memories" |
| "← Back to Memory" | Click | Return to list view |

#### Learning Settings Panel
| Element | Action | Result |
|---------|--------|--------|
| All preference option buttons | Click | Update + toast |
| Environment filter chips "X" | Click | Remove chip |
| Environment "Add" | Click/Enter | Add new chip |
| Auto-learning toggles | Click | Update selection |
| Stale threshold options | Click | Update selection |
| "Export JSON" | Click | Toast: "Exported memories.json" |
| "Delete All" | Click | Show confirmation |
| Confirm delete → "Yes" | Click | Toast: "All memories deleted" |
| Confirm delete → "Cancel" | Click | Hide confirmation |
| "Request Export" (GDPR) | Click | Toast: "GDPR export requested" |
| "← Back to Memory" | Click | Return to list view |

### 8. Integrations (`/integrations`)
| Element | Action | Result |
|---------|--------|--------|
| "Connect Integration" header | Click | Toast: "Opening marketplace" |
| Integration card | Click | Expand config panel |
| "Connect" button | Click | Toggle connected state + toast |
| "Configure" button | Click | Expand config panel |
| "Test Connection" | Click | Spinner 1.2s → toast: "healthy" |
| "Disconnect" | Click | Toggle to disconnected + toast |
| Read/Write checkboxes | Click | Toggle permissions |
| "Connect with OAuth" | Click | Toggle connected + toast |

### 9. Analytics (`/analytics`)
| Element | Action | Result |
|---------|--------|--------|
| All charts | Display/hover | Tooltips on data points |
| Health bars | Animated | Width animation on load |
| Team View table | Display only | No interaction |

### 10. Settings (`/settings`)
| Element | Action | Result |
|---------|--------|--------|
| Tab: Configuration | Click | Show config form |
| Tab: Memory Admin | Click | Show memory admin |
| All config option buttons | Click | Select option (visual toggle) |
| All checkboxes | Click | Toggle |
| "Save Changes" | Click | Toast: "Settings saved" |
| Stale memory "Archive" | Click | Toast: "Archived: {name}" |
| Stale memory "Review" | Click | Toast: "Reviewed: {name}" |
| Pending "Approve" | Click | Toast: "Approved: {name}" |
| Pending "Reject" | Click | Toast: "Rejected: {name}" |
| "Archive All Stale" | Click | Toast |
| "Export All (JSON)" | Click | Toast |
| "GDPR Purge" | Click | Toast |

### 11. Setup Wizard (`/setup`)
| Element | Action | Result |
|---------|--------|--------|
| "Get Started" | Click | Move to step 1 |
| Step nav (Back/Continue) | Click | Navigate steps |
| Account checkboxes | Click | Toggle |
| Alert condition cards | Click | Toggle selection |
| Tool "Connect with OAuth" | Click | Mark as connected |
| Cloud/Orchestration buttons | Click | Select option |
| Known Noise textarea | Type | Editable |
| "Run Test Investigation" | Click | Spinner 2.5s → results |
| "👍 Good" | Click | Show positive feedback msg |
| "👎 Needs work" | Click | Show improvement feedback msg |
| "Finish Setup" | Click | Move to completion screen |
| "Go to Dashboard" | Click | Navigate → `/` |
| "Explore Memory" | Click | Navigate → `/memory` |

### Global Components
| Element | Location | Action | Result |
|---------|----------|--------|--------|
| DemoLauncher FAB | Bottom-left | Click | Toggle scenario guide |
| Scenario "Start" | DemoLauncher | Click | Navigate to scenario |
| SreAgentNav tabs | Top nav | Click | Navigate between top-level pages |
| NR One Sidebar items | Left sidebar | Hover | Show tooltip (mock) |
| "SRE Agent" in sidebar | Left sidebar | Display | Active indicator |

## Known Dead Ends to Fix

1. **Memory Edit buttons** — "Edit" on My Knowledge and Team Knowledge just shows toast "Edit mode" / "Editing" but doesn't actually open an edit form
2. **"View in X →" data source links** — Need toast feedback since they can't actually open external tools
3. **Analytics charts/cards** — All display-only, no drill-down interactions
