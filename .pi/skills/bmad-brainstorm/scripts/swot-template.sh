#!/usr/bin/env bash
# SWOT Analysis Template Generator
# Part of the BMAD Planning & Orchestrator plugin
# Outputs a formatted SWOT analysis scaffold for planning sessions

set -euo pipefail

SUBJECT="${1:-your project/product/initiative}"

cat <<EOF
SWOT Analysis: $SUBJECT
Date: $(date +%Y-%m-%d)

=============================================================================
INTERNAL FACTORS (What you control)
=============================================================================

STRENGTHS                                 | WEAKNESSES
What advantages do you have?              | What could be improved?
What do you do well?                      | Where are resources lacking?
What unique resources exist?              | What do competitors do better?
What do others see as strengths?          | What factors reduce impact?
------------------------------------------|----------------------------------
                                          |
1.                                        | 1.
                                          |
2.                                        | 2.
                                          |
3.                                        | 3.
                                          |
4.                                        | 4.
                                          |
5.                                        | 5.
                                          |

=============================================================================
EXTERNAL FACTORS (What you don't control)
=============================================================================

OPPORTUNITIES                             | THREATS
What good opportunities are available?    | What threats could harm you?
What trends could you take advantage of?  | What is your competition doing?
How can you turn strengths into opps?     | What obstacles do you face?
What changes in market/tech/policy exist? | Are quality standards changing?
------------------------------------------|----------------------------------
                                          |
1.                                        | 1.
                                          |
2.                                        | 2.
                                          |
3.                                        | 3.
                                          |
4.                                        | 4.
                                          |
5.                                        | 5.
                                          |

=============================================================================
STRATEGIC ACTIONS
=============================================================================

SO Strategies (Strength + Opportunity)
Use strengths to capitalize on opportunities:
→
→
→

ST Strategies (Strength + Threat)
Use strengths to avoid or mitigate threats:
→
→
→

WO Strategies (Weakness + Opportunity)
Overcome weaknesses by taking advantage of opportunities:
→
→
→

WT Strategies (Weakness + Threat)
Minimize weaknesses and avoid threats:
→
→
→

=============================================================================
PRIORITY PLANNING ACTIONS
=============================================================================

Top 3 actions to carry forward into BMAD planning:

1.

2.

3.

=============================================================================
COMPLETION GUIDE
=============================================================================

STRENGTHS - Ask yourself:
- What do we do better than anyone else?
- What unique resources or assets do we have?
- What do users/customers value most about this?
- What advantages does our approach provide?

WEAKNESSES - Ask yourself:
- What do competitors do better?
- Where are we lacking resources (people, budget, capability)?
- What constraints reduce our effectiveness?
- What processes could be more efficient?

OPPORTUNITIES - Look for:
- Emerging market trends we can capitalize on
- User needs not being met by existing solutions
- New technologies or approaches that could help
- Regulatory or ecosystem changes that favor our direction
- Potential partnerships or integrations

THREATS - Consider:
- Strong alternatives or competitors in the space
- Changing user preferences or expectations
- Economic or ecosystem conditions affecting demand
- New regulations or compliance requirements
- Technology disruptions that could undermine the approach

Note: Be honest. The value of SWOT is revealing truth, not confirming assumptions.

Output this analysis to: bmad-output/brainstorm-swot.md
Then synthesize with other technique outputs into: bmad-output/brainstorming-report.md
EOF
