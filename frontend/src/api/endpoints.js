import apiClient from './client';

// Every resource module below is a thin, typed wrapper around a real backend
// route documented in docs/api-documentation.md. Nothing here is invented —
// if an endpoint isn't listed there or in the route files, it doesn't exist.

export const authApi = {
  setupAdmin: (payload) => apiClient.post('/auth/setup-admin', payload),
  login: (payload) => apiClient.post('/auth/login', payload),
  me: () => apiClient.get('/auth/me'),
};

export const instituteApi = {
  register: (payload) => apiClient.post('/institutes', payload),
  list: () => apiClient.get('/institutes'),
  getById: (id) => apiClient.get(`/institutes/${id}`),
  update: (id, payload) => apiClient.patch(`/institutes/${id}`, payload),
};

export const teacherApi = {
  create: (payload) => apiClient.post('/teachers', payload),
  list: () => apiClient.get('/teachers'),
  getById: (id) => apiClient.get(`/teachers/${id}`),
  update: (id, payload) => apiClient.patch(`/teachers/${id}`, payload),
  remove: (id) => apiClient.delete(`/teachers/${id}`),
};

export const studentApi = {
  create: (payload) => apiClient.post('/students', payload),
  list: () => apiClient.get('/students'),
  getById: (id) => apiClient.get(`/students/${id}`),
  update: (id, payload) => apiClient.patch(`/students/${id}`, payload),
  remove: (id) => apiClient.delete(`/students/${id}`),
};

export const courseApi = {
  create: (payload) => apiClient.post('/courses', payload),
  list: (params) => apiClient.get('/courses', { params }),
  getById: (id) => apiClient.get(`/courses/${id}`),
  update: (id, payload) => apiClient.patch(`/courses/${id}`, payload),
  remove: (id) => apiClient.delete(`/courses/${id}`),
};

export const batchApi = {
  create: (payload) => apiClient.post('/batches', payload),
  list: () => apiClient.get('/batches'),
  getById: (id) => apiClient.get(`/batches/${id}`),
  update: (id, payload) => apiClient.patch(`/batches/${id}`, payload),
  remove: (id) => apiClient.delete(`/batches/${id}`),
};

export const enrollmentApi = {
  create: (payload) => apiClient.post('/enrollments', payload),
  list: () => apiClient.get('/enrollments'),
  getById: (id) => apiClient.get(`/enrollments/${id}`),
  update: (id, payload) => apiClient.patch(`/enrollments/${id}`, payload),
  remove: (id) => apiClient.delete(`/enrollments/${id}`),
  byBatch: (batchId) => apiClient.get(`/enrollments/batch/${batchId}`),
  byStudent: (studentId) => apiClient.get(`/enrollments/student/${studentId}`),
};

export const attendanceApi = {
  create: (payload) => apiClient.post('/attendance', payload),
  list: () => apiClient.get('/attendance'),
  getById: (id) => apiClient.get(`/attendance/${id}`),
  update: (id, payload) => apiClient.patch(`/attendance/${id}`, payload),
  remove: (id) => apiClient.delete(`/attendance/${id}`),
  byStudent: (studentId) => apiClient.get(`/attendance/student/${studentId}`),
  byBatch: (batchId) => apiClient.get(`/attendance/batch/${batchId}`),
  byDate: (date) => apiClient.get(`/attendance/date/${date}`),
};

export const assignmentApi = {
  create: (payload) => apiClient.post('/assignments', payload),
  list: () => apiClient.get('/assignments'),
  getById: (id) => apiClient.get(`/assignments/${id}`),
  update: (id, payload) => apiClient.patch(`/assignments/${id}`, payload),
  remove: (id) => apiClient.delete(`/assignments/${id}`),
  submit: (assignmentId, payload) => apiClient.post(`/assignments/${assignmentId}/submit`, payload),
  submissions: (assignmentId) => apiClient.get(`/assignments/${assignmentId}/submissions`),
};

export const submissionApi = {
  getById: (id) => apiClient.get(`/submissions/${id}`),
  update: (id, payload) => apiClient.patch(`/submissions/${id}`, payload),
  remove: (id) => apiClient.delete(`/submissions/${id}`),
  grade: (id, payload) => apiClient.patch(`/submissions/${id}/grade`, payload),
};

export const examApi = {
  create: (payload) => apiClient.post('/exams', payload),
  list: () => apiClient.get('/exams'),
  getById: (id) => apiClient.get(`/exams/${id}`),
  update: (id, payload) => apiClient.patch(`/exams/${id}`, payload),
  remove: (id) => apiClient.delete(`/exams/${id}`),
  createResult: (examId, payload) => apiClient.post(`/exams/${examId}/results`, payload),
  results: (examId) => apiClient.get(`/exams/${examId}/results`),
};

export const examResultApi = {
  getById: (id) => apiClient.get(`/exam-results/${id}`),
  update: (id, payload) => apiClient.patch(`/exam-results/${id}`, payload),
  remove: (id) => apiClient.delete(`/exam-results/${id}`),
  publish: (id) => apiClient.patch(`/exam-results/${id}/publish`),
};

export const academicResultApi = {
  generateForBatch: (examId) => apiClient.post('/results/generate', { examId }),
  generateForStudent: (studentId, examId) => apiClient.post(`/results/generate/${studentId}`, { examId }),
  list: () => apiClient.get('/results'),
  getById: (id) => apiClient.get(`/results/${id}`),
  byStudent: (studentId) => apiClient.get(`/results/student/${studentId}`),
  byBatch: (batchId) => apiClient.get(`/results/batch/${batchId}`),
  publish: (id) => apiClient.patch(`/results/${id}/publish`),
  lock: (id) => apiClient.patch(`/results/${id}/lock`),
  unlock: (id) => apiClient.patch(`/results/${id}/unlock`),
  remove: (id) => apiClient.delete(`/results/${id}`),
};

export const feeStructureApi = {
  create: (payload) => apiClient.post('/fee-structures', payload),
  list: () => apiClient.get('/fee-structures'),
  getById: (id) => apiClient.get(`/fee-structures/${id}`),
  update: (id, payload) => apiClient.patch(`/fee-structures/${id}`, payload),
  remove: (id) => apiClient.delete(`/fee-structures/${id}`),
};

export const studentFeeApi = {
  create: (payload) => apiClient.post('/student-fees', payload),
  list: () => apiClient.get('/student-fees'),
  getById: (id) => apiClient.get(`/student-fees/${id}`),
  update: (id, payload) => apiClient.patch(`/student-fees/${id}`, payload),
};

export const paymentApi = {
  create: (payload) => apiClient.post('/payments', payload),
  list: () => apiClient.get('/payments'),
  getById: (id) => apiClient.get(`/payments/${id}`),
  byStudent: (studentId) => apiClient.get(`/payments/student/${studentId}`),
  remove: (id) => apiClient.delete(`/payments/${id}`),
};

export const dashboardApi = {
  courseAnalytics: () => apiClient.get('/dashboard/course-analytics'),
};
