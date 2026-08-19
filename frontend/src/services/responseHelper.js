export const normalizeServiceResponse = (payload) => {
  if (payload && typeof payload === 'object' && 'success' in payload) {
    return {
      success: payload.success,
      data: payload.data,
      message: payload.message || '',
      error: payload.error || null
    };
  }

  return {
    success: true,
    data: payload,
    message: '',
    error: null
  };
};
