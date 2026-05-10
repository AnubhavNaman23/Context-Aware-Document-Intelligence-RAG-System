import ollama

LLM_MODEL = "phi3:mini"

PROMPT_TEMPLATE = """You are a precise document question-answering assistant.

Use only the provided context.
Answer the user's question directly and briefly.

Rules:
- Start with the exact answer, not an introduction.
- If the user asks for a specific item like a week, date, amount, name, summary point, or list, return only that requested item.
- Do not add background, story, conclusion, or extra explanation unless the user explicitly asks for detail.
- Keep the answer under 80 words when possible.
- If the answer is a list in the document, use short bullet points.
- If the answer is not in the context, say exactly: Not found in the provided document context.

Context:
{context}

Question: {question}

Direct answer:"""

GENERATION_OPTIONS = {
    "temperature": 0.1,
    "top_p": 0.9,
    "repeat_penalty": 1.1,
    "num_predict": 160,
}


def generate_response(context, question):
    prompt = PROMPT_TEMPLATE.format(context=context, question=question)
    response = ollama.generate(model=LLM_MODEL, prompt=prompt, options=GENERATION_OPTIONS)
    if hasattr(response, "response"):
        return response.response
    if isinstance(response, dict) and "response" in response:
        return response["response"]
    return str(response)


def generate_response_stream(context, question):
    prompt = PROMPT_TEMPLATE.format(context=context, question=question)
    for chunk in ollama.generate(
        model=LLM_MODEL,
        prompt=prompt,
        stream=True,
        options=GENERATION_OPTIONS,
    ):
        if hasattr(chunk, "response"):
            yield chunk.response
        elif isinstance(chunk, dict) and "response" in chunk:
            yield chunk["response"]
