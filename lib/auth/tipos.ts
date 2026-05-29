// Estado retornado pelas server actions de autenticação, consumido pelos
// formulários via useFormState.
export type EstadoForm = {
  erro?: string;
  sucesso?: string;
};

export const ESTADO_INICIAL: EstadoForm = {};
