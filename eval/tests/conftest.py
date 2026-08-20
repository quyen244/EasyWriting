"""Shared fixtures for the evaluation workbench.

The Postgres, FastAPI `TestClient`, and authenticated-client fixtures that used to live here
were removed in constitution v3.0.0 along with the self-hosted backend. Nothing in this
package speaks HTTP or touches a database: it exercises the scoring pipeline directly, which
is what the Principle IV golden-set benchmark needs and all it needs.

Every test injects `FakeLLMClient`, so the suite makes zero upstream calls and costs nothing
to run (Constitution III + V).
"""

import pytest

# A real-shaped Task 2 essay, comfortably over the 250-word minimum. Written to contain
# specific quotable spans so evidence-verification tests can assert on genuine quotes
# rather than on strings that happen to appear.
TASK_2_ESSAY = """\
In recent decades, social media has fundamentally reshaped the way people communicate
with one another. Some commentators argue that this shift has impoverished human
relationships, while others maintain that it has widened access to community and
information. In my view, the benefits outweigh the drawbacks, provided that users
remain deliberate about how they spend their time online.

Those who criticise social media point to a decline in face-to-face interaction. It is
certainly true that a conversation conducted through short written messages lacks the
tone, expression and immediacy of speaking in person. Furthermore, the design of many
platforms rewards brevity and reaction rather than reflection, which can encourage
superficial exchanges. Critics also note that the constant visibility of other people's
curated lives may contribute to anxiety among younger users in particular.

Nevertheless, these criticisms overlook the genuine advantages that these technologies
have delivered. For people separated by distance, social media sustains relationships
that would previously have faded through simple lack of contact. Migrant workers can
speak to their children daily; patients with rare conditions can find others who
understand their experience. In professional contexts, these networks have flattened
access to expertise that was once confined to institutions.

The decisive question is not whether social media is inherently good or bad, but how it
is used. A platform that replaces every conversation is harmful; one that supplements
relationships already grounded in the physical world is not. Education therefore has an
important role to play in teaching young people to use these tools deliberately.

In conclusion, while the concerns raised by critics deserve serious attention, I believe
that social media has expanded human connection more than it has diminished it. The
responsibility lies with users and educators to ensure that the technology serves
relationships rather than substituting for them.
"""

# A genuine substring of TASK_2_ESSAY — used to exercise the verified-quote path.
REAL_QUOTE = "social media has fundamentally reshaped the way people communicate"

# Deliberately absent from TASK_2_ESSAY — exercises the fabrication-detection path.
FABRICATED_QUOTE = "the author categorically rejects all forms of modern technology"


@pytest.fixture
def fake_llm():
    """The default offline LLM double: band 6.0, quoting real essay text."""
    from tests.fakes.fake_llm_client import FakeLLMClient

    return FakeLLMClient(band=6.0, quote=REAL_QUOTE)
