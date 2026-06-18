BEGIN;

SELECT r.id_reserva, r.estado
FROM reservas r
WHERE r.id_reserva = 4
FOR UPDATE;

SAVEPOINT antes_de_aprobar;

UPDATE reservas
SET estado = 'aprobada'
WHERE id_reserva = 4;

UPDATE propiedades
SET estado = 'reservado'
WHERE id_propiedad = (
    SELECT id_propiedad
    FROM reservas
    WHERE id_reserva = 4
);

ROLLBACK TO SAVEPOINT antes_de_aprobar;
COMMIT;

BEGIN;

INSERT INTO pagos (
    id_contrato,
    monto,
    fecha_pago,
    metodo_pago,
    estado,
    referencia
)
VALUES (
    1,
    100.00,
    CURRENT_DATE,
    'efectivo',
    'completado',
    'DEMO-ROLLBACK'
);

ROLLBACK;
