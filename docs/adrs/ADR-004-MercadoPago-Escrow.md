# ADR-004: Mercado Pago Marketplace como Gateway de Pagos y Escrow
**Fecha:** Mayo 2025
**Fuente:** `docs/SDD_MASTER.md` v1.1

---

## Status

Aceptado

---

## Context

El modelo de negocio de APPATITAS (§2.1 del SDD) requiere un gateway de pagos que soporte el patrón **Marketplace con escrow**:

1. El Tutor paga el servicio al momento de la reserva.
2. Appatitas retiene la comisión estipulada.
3. El saldo restante se libera al Proveedor únicamente cuando el servicio es verificado como realizado (RN-001).

Este patrón requiere que el gateway soporte **split de pagos** (división automática entre la cuenta de la plataforma y la cuenta del Proveedor) y **retención temporal de fondos** hasta la confirmación del servicio. Adicionalmente:

- El ámbito inicial es **Córdoba, Argentina**, lo que exige un gateway con cobertura y compliance regulatorio en Argentina.
- Los Proveedores son personas físicas (DNI) o personas jurídicas (CUIT) que deben poder recibir transferencias en pesos argentinos (ARS).
- El SDD v1.1 documenta en `providers` los campos `billing_email`, `payout_method` y `onboarding_status`, implicando un proceso de alta de cada Proveedor en la plataforma de pagos.

---

## Decision

Adoptar **Mercado Pago en modalidad Marketplace** como único gateway de pagos para Fase 2.

**Responsabilidades del gateway:**
- Procesar el pago del Tutor al momento de la reserva.
- Retener la comisión de Appatitas sobre la transacción.
- Liberar el saldo al Proveedor una vez verificado el servicio realizado (RN-001).

**Responsabilidades de APPATITAS (no del gateway):**
- Gestionar el estado `onboarding_status` del Proveedor durante el proceso de alta en Mercado Pago.
- Disparar la liberación de fondos cuando el servicio sea verificado (mecanismo no especificado en el SDD — ver GAP-003).
- Almacenar `payout_method` y `billing_email` del Proveedor en la tabla `providers`.

**Appatitas no almacena datos de tarjetas de crédito/débito.** El procesamiento sensible es íntegramente delegado a Mercado Pago.

---

## Consequences

**Positivas:**
- Mercado Pago Marketplace es la solución estándar de split de pagos con escrow para el mercado argentino.
- Amplia penetración en Argentina: los Tutores ya tienen cuentas Mercado Pago en alta proporción, reduciendo fricciones de pago.
- Compliance regulatorio argentino (AFIP, normativa BCRA) gestionado por Mercado Pago, no por el equipo de APPATITAS.
- APPATITAS no es responsable del almacenamiento de datos de tarjetas (PCI DSS delegado al gateway).

**Negativas / Restricciones:**
- La cuenta Marketplace de Mercado Pago requiere un proceso de aprobación externo fuera del control del equipo. Un rechazo o demora bloquea la monetización completa de Fase 2.
- Cada Proveedor debe completar su propio onboarding en Mercado Pago. El `onboarding_status` en `providers` debe sincronizarse con el estado real de la cuenta Mercado Pago del Proveedor.
- El mecanismo de verificación de servicio realizado que dispara la liberación de fondos no está documentado en el SDD v1.1 (GAP-003). Sin definirlo, el dinero retenido no tiene disparador de liberación.
- Las comisiones y tarifas de Mercado Pago se suman a la comisión de APPATITAS, afectando el margen neto. El porcentaje de comisión de APPATITAS tampoco está documentado en el SDD (GAP-002).

---

## Alternatives Considered

| Alternativa | Motivo de descarte |
|---|---|
| **Stripe** | No opera directamente con cuentas bancarias argentinas ni soporta payouts en ARS de forma nativa. Requeriría un intermediario adicional para el mercado local. |
| **PayPal** | Baja penetración en el segmento de Proveedores locales (paseadores, peluqueros, veterinarios independientes) en Córdoba. El onboarding de Proveedores sería una barrera alta. |
| **Transferencia bancaria manual (CBU/CVU)** | No escala. Requiere intervención manual del equipo de APPATITAS en cada pago y no soporta el modelo de escrow automático requerido por RN-001. |
| **Prisma Medios de Pago (Todo Pago)** | Cubre el mercado argentino pero tiene menor documentación pública, ecosistema de integración más limitado y menor penetración que Mercado Pago en el segmento objetivo. |
