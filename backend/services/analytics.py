"""
Analytics service.
Aggregates question logs to surface topic clusters.
"""

import os
from typing import Dict, Any

from openai import OpenAI

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])


def get_analytics(supabase_client, course_id: str) -> Dict[str, Any]:
    """
    Return analytics for a course:
    - total_questions
    - topics: [{topic, count}] — clustered by LLM
    """
    result = (
        supabase_client.table("question_logs")
        .select("question")
        .eq("course_id", course_id)
        .order("created_at", desc=True)
        .limit(200)
        .execute()
    )

    logs = result.data or []
    total = len(logs)

    if total == 0:
        return {
            "total_questions": 0,
            "topics": [],
        }

    questions = [log["question"] for log in logs[:50]]
    topics = cluster_topics(questions)

    return {
        "total_questions": total,
        "topics": topics,
    }


def cluster_topics(questions: list[str]) -> list[dict]:
    """
    Use GPT to cluster questions into topic groups.
    Returns [{topic, count}] sorted by count desc.
    """
    if not questions:
        return []

    numbered = "\n".join(f"{i+1}. {q}" for i, q in enumerate(questions))

    prompt = f"""You are analyzing student questions from a university course.
Group these questions into 3-8 topic clusters. For each cluster, give a short topic label (3-6 words).
Return ONLY a JSON object like:
{{"clusters": [{{"topic": "...", "question_indices": [1, 3, 5]}}, ...]}}

Questions:
{numbered}"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=800,
            response_format={"type": "json_object"},
        )
        import json
        parsed = json.loads(response.choices[0].message.content)
        clusters = parsed.get("clusters", [])

        result = []
        for cluster in clusters:
            indices = [i - 1 for i in cluster.get("question_indices", []) if 1 <= i <= len(questions)]
            if not indices:
                continue
            result.append({
                "topic": cluster["topic"],
                "count": len(indices),
            })

        return sorted(result, key=lambda x: x["count"], reverse=True)

    except Exception:
        # Fallback: return first 10 questions as-is
        return [{"topic": q[:60], "count": 1} for q in questions[:10]]
