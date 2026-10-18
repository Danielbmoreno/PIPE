import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getOverview } from '../services/dashboardService.js';
import { activityHistory } from '../lib/academic.js';
import { AcademicEvolution, Motivation, RecordTimeline } from '../components/ui/AccompanimentWidgets.jsx';
import Loader from '../components/ui/Loader.jsx';
export default function StudentRecord() {
  const { id } = useParams();
  const { user } = useAuth();
  const target = id || user.estudiante_id;
  const [record, setRecord] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    getOverview().then((result) => {
      if (!active) return;
      if (!result.success) { setError(result.error); return; }
      const student = result.data.estudiantes.find((e) => String(e.id) === String(target));
      if (!student) { setError('Expediente no disponible para tu cuenta institucional.'); return; }
      const cases = result.data.casos.filter((r) => r.estudiante_id === student.id);
      const data = Object.fromEntries(Object.entries(result.data).map(([table, rows]) => [table, table === 'estudiantes' ? [student] : table === 'programas' ? rows : table === 'intervenciones' ? rows.filter((r) => cases.some((c) => c.id === r.caso_id)) : rows.filter((r) => r.estudiante_id === student.id)]));
      setRecord({ student, data });
    });
    return () => { active = false; };
  }, [target]);
  if (error) return <div className="page-shell"><h1>Expediente académico</h1><div className="alert-box" role="alert">{error}</div></div>;
  if (!record) return <Loader />;
  const { student, data } = record;
  const program = data.programas.find((p) => p.id === student.programa_id);
  const values = [['Correo institucional', student.correo], ['Institución', student.institucion], ['Sede', student.sede], ['Programa', program?.nombre], ['Semestre', student.semestre], ['Estado académico', student.estado], ['Proceso académico', student.rendimiento_resumen], ['Acompañamiento', student.estado_acompanamiento], ['Nivel de riesgo registrado', student.nivel_riesgo]];
  return <div className="page-shell"><Link to={user.rol_id === 'estudiante' ? '/app/profile' : '/app/estudiantes'}>← Volver</Link><section className="profile-hero"><div><span className="eyebrow">EXPEDIENTE INSTITUCIONAL</span><h1>{student.nombre}</h1><p>{program?.nombre || 'Programa por confirmar'}</p></div></section><div className="pipe-overview-grid"><section className="section-card"><h2>Información académica</h2><dl className="pipe-academic-fields">{values.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || 'Pendiente de confirmar'}</dd></div>)}</dl></section><AcademicEvolution records={data.seguimientos} /></div><div className="pipe-record-links">{['citas', 'consultas', 'seguimientos', ...(user.rol_id === 'estudiante' ? [] : ['alertas', 'casos', 'intervenciones'])].map((table) => <Link className="section-card" key={table} to={`/app/${table === 'citas' && user.rol_id === 'estudiante' ? 'mis-citas' : table}?estudiante=${student.id}`}><strong>{data[table].length}</strong><span>{table}</span></Link>)}</div><section className="section-card"><h2>Historial de acompañamiento</h2><RecordTimeline events={activityHistory(data)} limit={40} /></section><Motivation /></div>;
}
