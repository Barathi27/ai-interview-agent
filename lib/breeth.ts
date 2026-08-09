const BREETH_API_URL = "https://api.thebreeth.com/v1";

export async function saveMemory(content: string, groupId: string) {
  const response = await fetch(`${BREETH_API_URL}/episodes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.BREETH_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content,
      group_id: groupId,
      extract_intent: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(`Breeth save failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function searchMemory(query: string, limit = 5) {
  const response = await fetch(`${BREETH_API_URL}/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.BREETH_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      limit,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(`Breeth search failed: ${response.status} ${errorText}`);
  }

  return response.json();
}
