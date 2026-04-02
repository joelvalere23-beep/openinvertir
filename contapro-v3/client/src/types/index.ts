export interface Transaction {
  tipo: 'ingreso' | 'egreso';
  desc: string;
  cat: string;
  monto: number;
  fecha: string;
}

export interface Factura {
  num: string;
  cli: string;
  con: string;
  sub: number;
  iva: number;
  tot: number;
  ven: string;
  met: string;
  est: 'cobrada' | 'pendiente';
}

export interface Empleado {
  nom: string;
  puesto: string;
  depto: string;
  sal: number;
  ingreso: string;
  contrato: string;
}

export interface BalanceItem {
  desc: string;
  tipo: string;
  monto: number;
}
