class SSEClient {
  constructor() {
    this.eventSource = null;
    this.abortController = null;
  }

  async connect(url, options = {}) {
    const {
      onStatus = () => {},
      onResult = () => {},
      onError = () => {},
      onDone = () => {},
      onPing = () => {},
    } = options;

    this.abortController = new AbortController();

    try {
      const response = await fetch(url, {
        method: options.method || 'POST',
        body: options.body,
        signal: this.abortController.signal,
        headers: {
          'Accept': 'text/event-stream',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event:')) {
            const eventType = line.substring(6).trim();
            continue;
          }

          if (line.startsWith('data:')) {
            const data = line.substring(5).trim();
            
            if (!data) continue;

            try {
              const parsedData = JSON.parse(data);
              
              if (line.includes('"stage"')) {
                onStatus(parsedData);
              } else if (parsedData.success !== undefined) {
                if (parsedData.success === false) {
                  onError(parsedData);
                } else {
                  onResult(parsedData);
                }
              }
            } catch (e) {
              if (data === '{}') {
                onDone();
              } else {
                console.warn('Failed to parse SSE data:', data, e);
              }
            }
          }

          if (line.trim() === '') {
            continue;
          }
        }
      }

      onDone();
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('SSE connection aborted');
      } else {
        console.error('SSE connection error:', error);
        onError({
          success: false,
          status: 'failure',
          data: {},
          error: error.message,
        });
      }
    }
  }

  disconnect() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}

export default SSEClient;
