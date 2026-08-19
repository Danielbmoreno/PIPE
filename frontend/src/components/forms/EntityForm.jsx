const EntityForm = ({ fields, values, onChange }) => {
  return (
    <div className="form-grid">
      {fields.map((field) => (
        <label key={field.name} className="field-group">
          <span>{field.label}</span>
          <input
            type={field.type || 'text'}
            name={field.name}
            value={values[field.name] || ''}
            onChange={onChange}
            placeholder={field.placeholder || ''}
          />
        </label>
      ))}
    </div>
  );
};

export default EntityForm;
