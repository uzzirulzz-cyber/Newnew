import { NextRequest } from "next/server";
import { ok, applyRateLimit } from "@/lib/api";

/**
 * GET /api/v1/careers
 *
 * Returns the list of published job listings. Hardcoded sample data — wire
 * up to a real JobListing model once one exists.
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 120);
  if (limited) return limited;

  const items = [
    {
      id: "job-1",
      slug: "senior-product-engineer",
      title: "Senior Product Engineer",
      department: "Engineering",
      location: "Remote (Global)",
      type: "full-time",
      description:
        "We're looking for a senior product engineer to help us build the next generation of our platform. You'll work across the stack — from database design to UI polish — and ship to real users every week.\n\n## What you'll do\n\n- Own features end-to-end, from spec to ship\n- Partner with design on product direction\n- Mentor mid-level engineers\n- Improve our development workflow\n\n## Requirements\n\n- 5+ years building production web apps\n- Strong TypeScript and React experience\n- Comfortable with Node.js and SQL databases\n- Excellent written communication",
      published: true,
      order: 1,
    },
    {
      id: "job-2",
      slug: "product-designer",
      title: "Product Designer",
      department: "Design",
      location: "Remote (EU / US)",
      type: "full-time",
      description:
        "As our first dedicated product designer, you'll shape the visual language and interaction patterns of everything we ship. You'll partner closely with engineering and own the design system end-to-end.\n\n## What you'll do\n\n- Design new features from wireframe to high-fidelity\n- Maintain and evolve our component library\n- Run usability tests with real customers\n- Set the bar for craft across the product\n\n## Requirements\n\n- 4+ years in product design roles\n- Strong portfolio of shipped work\n- Comfortable prototyping in code (React a plus)",
      published: true,
      order: 2,
    },
    {
      id: "job-3",
      slug: "developer-advocate",
      title: "Developer Advocate",
      department: "Marketing",
      location: "Remote (North America)",
      type: "full-time",
      description:
        "Help us build a community of developers around our platform. You'll create content, run events, and feed insights back to the product team.\n\n## What you'll do\n\n- Write technical blog posts and tutorials\n- Speak at conferences and meetups\n- Engage with our community on Discord and GitHub\n- Influence the product roadmap with developer feedback\n\n## Requirements\n\n- Strong technical writing skills\n- Experience as a developer (any stack)\n- Comfortable on stage and on camera",
      published: true,
      order: 3,
    },
    {
      id: "job-4",
      slug: "customer-support-specialist",
      title: "Customer Support Specialist",
      department: "Support",
      location: "Lahore, Pakistan (Hybrid)",
      type: "full-time",
      description:
        "Be the first voice our customers hear. You'll answer questions, troubleshoot issues, and turn customer pain into product improvements.\n\n## What you'll do\n\n- Respond to customer tickets within SLA\n- Triage and reproduce bug reports\n- Write help documentation\n- Partner with engineering on escalations\n\n## Requirements\n\n- 2+ years in customer support\n- Excellent written English\n- Empathy and patience",
      published: true,
      order: 4,
    },
    {
      id: "job-5",
      slug: "contract-technical-writer",
      title: "Technical Writer (Contract)",
      department: "Engineering",
      location: "Remote",
      type: "contract",
      description:
        "We need a technical writer for a 3-month engagement to overhaul our public docs. If it goes well, there's potential for ongoing part-time work.\n\n## What you'll do\n\n- Audit existing documentation for accuracy and clarity\n- Rewrite the API reference and quickstart guides\n- Create code samples in JavaScript, Python, and cURL\n- Work with engineers to validate everything\n\n## Requirements\n\n- 3+ years writing developer docs\n- Comfortable reading REST APIs and SDKs\n- Excellent prose",
      published: true,
      order: 5,
    },
  ];

  return ok({ items });
}
