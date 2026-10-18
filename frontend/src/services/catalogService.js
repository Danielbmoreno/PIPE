import { listRows } from './supabaseService.js';
export default { getPrograms: () => listRows('programas'), getStudents: () => listRows('estudiantes'), getCases: () => listRows('casos') };
