const Toast = ({ type, message }) => {
  return (
    <div className={`toast ${type === 'error' ? 'toast-error' : 'toast-success'}`}>
      <p>{message}</p>
    </div>
  );
};

export default Toast;
