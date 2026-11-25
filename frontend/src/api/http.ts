export interface ApiResult<T> {
  code: number
  message: string
  data: T
}

export async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
      ...init,
    })
  } catch {
    throw new Error('无法连接后端，请确认已启动 backend（端口 7001）')
  }

  let body: ApiResult<T>
  try {
    body = (await res.json()) as ApiResult<T>
  } catch {
    throw new Error(`请求失败 (${res.status})`)
  }

  if (!res.ok || body.code !== 0) {
    throw new Error(body.message || `请求失败 (${res.status})`)
  }

  return body.data
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    await request<{ mysql: boolean }>('/api/health')
    return true
  } catch {
    return false
  }
}
