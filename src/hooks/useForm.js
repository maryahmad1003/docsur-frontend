import { useState, useCallback } from 'react';

/**
 * Hook pour gérer les formulaires avec validation
 * @param {Object} initialValues - valeurs initiales
 * @param {Function} validate - fn(values) => { field: 'message' }
 */
export function useForm(initialValues = {}, validate = null) {
  const [values, setValues]   = useState(initialValues);
  const [errors, setErrors]   = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked, files } = e.target;
    setValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value,
    }));
    // Effacer l'erreur dès que l'utilisateur modifie le champ
    if (errors[name]) {
      setErrors(prev => { const next = { ...prev }; delete next[name]; return next; });
    }
  }, [errors]);

  const handleBlur = useCallback((e) => {
    setTouched(prev => ({ ...prev, [e.target.name]: true }));
  }, []);

  const setValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
  }, []);

  const setFieldError = useCallback((name, message) => {
    setErrors(prev => ({ ...prev, [name]: message }));
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setSubmitting(false);
  }, [initialValues]);

  const handleSubmit = useCallback((onSubmit) => async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    // Marquer tous les champs comme touchés
    const allTouched = Object.keys(values).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setTouched(allTouched);

    // Validation si fournie
    if (validate) {
      const validationErrors = validate(values);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }
    }

    setSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setSubmitting(false);
    }
  }, [values, validate]);

  return {
    values, errors, touched, submitting,
    handleChange, handleBlur, handleSubmit,
    setValue, setFieldError, reset,
  };
}

export default useForm;
