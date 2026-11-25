create database erp_pf;

use erp_pf;

CREATE TABLE cp_product (
        product_id NVARCHAR(50) PRIMARY KEY,
        name NVARCHAR(50),
        description NVARCHAR(300),
        minimum_stock INT,
        price DECIMAL(18,2),
        img NVARCHAR(300)
        );
drop table cp_product;

EXEC sp_rename
    'cp_product.warehouse',
    'warehouse_id', 
    'COLUMN';

ALTER TABLE cp_product
DROP COLUMN warehouse, stock;

    -- remove stock, warehouse
INSERT INTO cp_product
    (product_id, name, description, minimum_stock, price, img)
VALUES
    ('SKU-PC-001', 'Gaming Desktop PC', 'High-performance desktop computer for gaming and demanding applications.', 5, 1299.99, 'gaming_pc.png'),
    ('SKU-PC-002', 'Office Desktop PC', 'Reliable desktop computer for office work, productivity, and everyday tasks.', 8, 649.99, 'office_desktop.png'),
    ('SKU-PC-003', 'Laptop 15.6 Inch', 'Versatile laptop suitable for business, education, and home use.', 6, 799.99, 'laptop_15_6.png'),
    ('SKU-PC-004', 'Gaming Laptop', 'Powerful gaming laptop with dedicated graphics and high-speed processing.', 4, 1499.99, 'gaming_laptop.png'),
    ('SKU-PC-005', 'Mechanical Keyboard', 'Durable mechanical keyboard with responsive switches for gaming and typing.', 10, 89.99, 'mech_keyboard.png'),
    ('SKU-PC-006', 'Wireless Mouse', 'Ergonomic wireless mouse with adjustable sensitivity and long battery life.', 15, 29.99, 'w_mouse.png'),
    ('SKU-PC-007', 'Gaming Monitor 27', '27-inch gaming monitor with high refresh rate and sharp image quality.', 5, 329.99, 'gaming_monitor_27.png'),
    ('SKU-PC-008', 'Office Monitor 24', '24-inch Full HD monitor designed for office productivity and daily use.', 8, 159.99, 'office_monitor_24.png'),
    ('SKU-PC-009', 'Solid State Drive 1TB', '1TB SSD providing fast storage access and improved system performance.', 10, 99.99, 'ssd_1tb.png'),
    ('SKU-PC-010', 'DDR4 RAM 16GB', '16GB DDR4 desktop memory module for multitasking and general computing.', 12, 44.99, 'ddr4_ram_16gb.png'),
    ('SKU-PC-011', 'Graphics Card 8GB', 'Dedicated graphics card with 8GB memory for gaming and creative workloads.', 4, 399.99, 'gc_8gb.png'),
    ('SKU-PC-012', 'Power Supply 750W', '750W power supply unit for desktop computers and gaming systems.', 6, 109.99, 'power_supply_750w.png'),
    ('SKU-PC-013', 'ATX Computer Case', 'Mid-tower ATX computer case with ventilation and cable management features.', 7, 79.99, 'atx_case.png'),
    ('SKU-PC-014', 'CPU Air Cooler', 'Efficient CPU air cooler designed to maintain stable processor temperatures.', 8, 39.99, 'cpu_cooler.png'),
    ('SKU-PC-015', 'USB-C Docking Station', 'Multiport docking station for connecting displays, USB devices, and peripherals.', 5, 119.99, 'usb_dock.png'),
    ('SKU-PC-016', 'Wi-Fi 6 Network Adapter', 'Wireless network adapter supporting Wi-Fi 6 for fast and reliable connectivity.', 10, 34.99, 'wifi_adapter.png');

SELECT COUNT(*) 
FROM (
    SELECT 
        p.product_id, 
        p.minimum_stock, 
        SUM(wp.quantity) AS total_quantity
    FROM cp_product p
    INNER JOIN cp_warehouse_product wp 
        ON p.product_id = wp.product_id
    GROUP BY p.product_id, p.minimum_stock
    HAVING SUM(wp.quantity) <= p.minimum_stock
) AS low_stock_summary;

    select * from cp_product
    select name from cp_product where name like '%Power Supply%' 

    SELECT SUM(stock * price) AS TotalValue FROM cp_product;

    delete from cp_product;

CREATE TABLE cp_warehouse (
        warehouse_id NVARCHAR(50) PRIMARY KEY,
        name NVARCHAR(50),
        address NVARCHAR(300)
        );

INSERT INTO cp_warehouse (warehouse_id, name, address)
VALUES
('WH001', 'Main Warehouse', '350 5th Avenue, New York, NY 10118'),
('WH002', 'Secondary Warehouse', '120 Broadway, New York, NY 10271'),
('WH003', 'Store Front', '1500 Broadway, New York, NY 10036');

select * from cp_warehouse

CREATE TABLE dbo.cp_warehouse_product
(
    warehouse_product_id NVARCHAR(50),
    warehouse_id         NVARCHAR(50),
    product_id           NVARCHAR(50),
    quantity             INT,

    CONSTRAINT PK_warehouse_product_ids
        PRIMARY KEY (warehouse_product_id),

    CONSTRAINT FK_warehouse_product_warehouse
        FOREIGN KEY (warehouse_id)
        REFERENCES dbo.cp_warehouse (warehouse_id),

    CONSTRAINT FK_warehouse_product_product
        FOREIGN KEY (product_id)
        REFERENCES dbo.cp_product (product_id),
);

INSERT INTO dbo.cp_warehouse_product
    (warehouse_product_id, warehouse_id, product_id, quantity)
VALUES
    -- Warehouse 001: Main Warehouse
    ('WP001', 'WH001', 'SKU-PC-001', 12),
    ('WP002', 'WH001', 'SKU-PC-002', 8),
    ('WP003', 'WH001', 'SKU-PC-003', 10),
    ('WP004', 'WH001', 'SKU-PC-004', 6),
    ('WP005', 'WH001', 'SKU-PC-005', 15),
    ('WP006', 'WH001', 'SKU-PC-006', 9),
    ('WP007', 'WH001', 'SKU-PC-007', 7),
    ('WP008', 'WH001', 'SKU-PC-008', 11),
    ('WP009', 'WH001', 'SKU-PC-009', 8),
    ('WP010', 'WH001', 'SKU-PC-010', 14),
    ('WP011', 'WH001', 'SKU-PC-011', 10),
    ('WP012', 'WH001', 'SKU-PC-012', 6),
    ('WP013', 'WH001', 'SKU-PC-013', 12),
    ('WP014', 'WH001', 'SKU-PC-014', 9),
    ('WP015', 'WH001', 'SKU-PC-015', 5),
    ('WP016', 'WH001', 'SKU-PC-016', 7),

    -- Warehouse 002: Secondary Warehouse
    ('WP017', 'WH002', 'SKU-PC-001', 6),
    ('WP018', 'WH002', 'SKU-PC-002', 10),
    ('WP019', 'WH002', 'SKU-PC-003', 8),
    ('WP020', 'WH002', 'SKU-PC-004', 9),
    ('WP021', 'WH002', 'SKU-PC-005', 7),
    ('WP022', 'WH002', 'SKU-PC-006', 12),
    ('WP023', 'WH002', 'SKU-PC-007', 5),
    ('WP024', 'WH002', 'SKU-PC-008', 8),
    ('WP025', 'WH002', 'SKU-PC-009', 11),
    ('WP026', 'WH002', 'SKU-PC-010', 6),
    ('WP027', 'WH002', 'SKU-PC-011', 9),
    ('WP028', 'WH002', 'SKU-PC-012', 10),
    ('WP029', 'WH002', 'SKU-PC-013', 7),
    ('WP030', 'WH002', 'SKU-PC-014', 8),
    ('WP031', 'WH002', 'SKU-PC-015', 6),
    ('WP032', 'WH002', 'SKU-PC-016', 4),

    -- Warehouse 003: Store Front
    ('WP033', 'WH003', 'SKU-PC-001', 4),
    ('WP034', 'WH003', 'SKU-PC-002', 5),
    ('WP035', 'WH003', 'SKU-PC-003', 3),
    ('WP036', 'WH003', 'SKU-PC-004', 6),
    ('WP037', 'WH003', 'SKU-PC-005', 8),
    ('WP038', 'WH003', 'SKU-PC-006', 4),
    ('WP039', 'WH003', 'SKU-PC-007', 7),
    ('WP040', 'WH003', 'SKU-PC-008', 5),
    ('WP041', 'WH003', 'SKU-PC-009', 6),
    ('WP042', 'WH003', 'SKU-PC-010', 7),
    ('WP043', 'WH003', 'SKU-PC-011', 5),
    ('WP044', 'WH003', 'SKU-PC-012', 4),
    ('WP045', 'WH003', 'SKU-PC-013', 6),
    ('WP046', 'WH003', 'SKU-PC-014', 5),
    ('WP047', 'WH003', 'SKU-PC-015', 3),
    ('WP048', 'WH003', 'SKU-PC-016', 4);

    SELECT *
FROM dbo.cp_warehouse_product;

SELECT
    product_id,
    SUM(quantity) AS total_quantity
FROM dbo.cp_warehouse_product
GROUP BY product_id
ORDER BY product_id;

CREATE SEQUENCE dbo.WarehouseProductIdSequence
AS INT
START WITH 49
INCREMENT BY 1;

-- Get current sequence value
SELECT current_value
FROM sys.sequences
WHERE name = 'WarehouseProductIdSequence';


DROP SEQUENCE dbo.WarehouseProductIdSequence;

    -- Create customers table
CREATE TABLE cp_customer (
    customer_id   NVARCHAR(50)  NOT NULL PRIMARY KEY,
    customer_type NVARCHAR(20),
    first_name    NVARCHAR(100) DEFAULT '',
    last_name     NVARCHAR(100) DEFAULT '',
    company_name  NVARCHAR(200) DEFAULT '',
    email         NVARCHAR(255) DEFAULT '',
    phone         NVARCHAR(30) DEFAULT '',
    tax_id        NVARCHAR(50) DEFAULT '',

    CONSTRAINT CK_cp_customer_customer_type
        CHECK (customer_type IN ('individual', 'company'))
);
GO

-- Insert 15 generic customers
INSERT INTO cp_customer
    (customer_id, customer_type, first_name, last_name,
     company_name, email, phone, tax_id)
VALUES
    ('CUS001', 'individual', 'John',     'Smith',    '',                    'john.smith@example.com',       '555-0101', 'TAX-1001'),
    ('CUS002', 'individual', 'Emma',     'Johnson',  '',                    'emma.johnson@example.com',     '555-0102', 'TAX-1002'),
    ('CUS003', 'company',    '',         '',         'Acme Solutions',      'contact@acmesolutions.example','555-0103', 'TAX-1003'),
    ('CUS004', 'individual', 'Michael',  'Brown',    '',                    'michael.brown@example.com',    '555-0104', 'TAX-1004'),
    ('CUS005', 'company',    '',         '',         'Global Trading',      'info@globaltrading.example',   '555-0105', 'TAX-1005'),
    ('CUS006', 'individual', 'Sophia',   'Davis',    '',                    'sophia.davis@example.com',     '555-0106', 'TAX-1006'),
    ('CUS007', 'individual', 'Daniel',   'Wilson',   '',                    'daniel.wilson@example.com',    '555-0107', 'TAX-1007'),
    ('CUS008', 'company',    '',         '',         'BlueSky Technologies','sales@bluesky.example',        '555-0108', 'TAX-1008'),
    ('CUS009', 'individual', 'Olivia',   'Martinez', '',                    'olivia.martinez@example.com',  '555-0109', 'TAX-1009'),
    ('CUS010', 'company',    '',         '',         'GreenLeaf Supplies',  'orders@greenleaf.example',     '555-0110', 'TAX-1010'),
    ('CUS011', 'individual', 'James',    'Anderson', '',                    'james.anderson@example.com',   '555-0111', 'TAX-1011'),
    ('CUS012', 'individual', 'Isabella', 'Thomas',   '',                    'isabella.thomas@example.com',  '555-0112', 'TAX-1012'),
    ('CUS013', 'company',    '',         '',         'Prime Logistics',     'support@primelogistics.example','555-0113', 'TAX-1013'),
    ('CUS014', 'individual', 'Benjamin', 'Taylor',   '',                    'benjamin.taylor@example.com',  '555-0114', 'TAX-1014'),
    ('CUS015', 'company',    '',         '',         'Everest Consulting',  'contact@everest.example',      '555-0115', 'TAX-1015');
GO

-- Verify inserted records
SELECT *
FROM cp_customer

delete from cp_customer

CREATE SEQUENCE dbo.CustomerIdSequence
    AS INT
    START WITH 16
    INCREMENT BY 1;

SELECT current_value 
FROM sys.sequences 
WHERE name = 'CustomerIdSequence';

SELECT NEXT VALUE FOR dbo.CustomerIdSequence;
DROP SEQUENCE dbo.CustomerIdSequence

IF OBJECT_ID(N'cp_customer_address', N'U') IS NULL
BEGIN
    CREATE TABLE cp_customer_address
    (
        customer_address_id NVARCHAR(50) NOT NULL,
        customer_id         NVARCHAR(50),
        address_type        NVARCHAR(20),
        line_1              NVARCHAR(200),
        line_2              NVARCHAR(200),
        city                NVARCHAR(100),
        state               NVARCHAR(100),
        postal_code         NVARCHAR(20),

        CONSTRAINT PK_customer_address
            PRIMARY KEY (customer_address_id),

        CONSTRAINT FK_customers
            FOREIGN KEY (customer_id)
            REFERENCES cp_customer(customer_id),

    );
END;
GO

select * from cp_customer_address

INSERT INTO cp_customer_address
(
    customer_address_id,
    customer_id,
    address_type,
    line_1,
    line_2,
    city,
    state,
    postal_code
)
VALUES
    (N'CAD001', N'CUS001', N'billing',  N'Calle Los Almendros 123', N'Colonia Escalon',       N'San Salvador', N'San Salvador', N'1101'),
    (N'CAD002', N'CUS002', N'shipping', N'Avenida Las Palmeras 45', N'Residencial Las Flores', N'Santa Tecla',  N'La Libertad',   N'1501'),
    (N'CAD003', N'CUS003', N'billing',  N'Calle El Carmen 78',      N'Apartamento 2',          N'Soyapango',    N'San Salvador', N'1116'),
    (N'CAD004', N'CUS004', N'shipping', N'Avenida Central 210',     N'Casa 4',                 N'Antiguo Cuscatlan', N'La Libertad', N'1502'),
    (N'CAD005', N'CUS005', N'billing',  N'Calle Las Gardenias 56',  N'',                       N'Mejicanos',    N'San Salvador', N'1120'),
    (N'CAD006', N'CUS006', N'shipping', N'Avenida El Sol 89',       N'Colonia Centro',         N'Santa Ana',    N'Santa Ana',    N'2201'),
    (N'CAD007', N'CUS007', N'billing',  N'Calle Principal 34',      N'Casa B',                 N'San Miguel',   N'San Miguel',   N'3301'),
    (N'CAD008', N'CUS008', N'shipping', N'Boulevard del Norte 150', N'',                       N'Apopa',        N'San Salvador', N'1123'),
    (N'CAD009', N'CUS009', N'billing',  N'Calle Las Flores 67',     N'Poligono C',             N'Zacatecoluca', N'La Paz',       N'1601'),
    (N'CAD010', N'CUS010', N'shipping', N'Avenida Los Pinos 92',    N'Casa 12',                N'Sonsonate',    N'Sonsonate',    N'2301'),
    (N'CAD011', N'CUS011', N'billing',  N'Calle El Progreso 18',    N'',                       N'La Union',     N'La Union',     N'3101'),
    (N'CAD012', N'CUS012', N'shipping', N'Avenida La Esperanza 75', N'Local 3',                N'Usulutan',     N'Usulutan',     N'3401'),
    (N'CAD013', N'CUS013', N'billing',  N'Calle Los Robles 41',     N'Colonia Norte',          N'Ilopango',     N'San Salvador', N'1117'),
    (N'CAD014', N'CUS014', N'shipping', N'Boulevard Las Brisas 60', N'',                       N'Quezaltepeque',N'La Libertad',  N'1512'),
    (N'CAD015', N'CUS015', N'billing',  N'Calle El Centro 105',     N'Casa 7',                 N'Chalatenango', N'Chalatenango', N'1301')

CREATE SEQUENCE dbo.CustomerAddressIdSequence
AS INT
START WITH 16
INCREMENT BY 1;

SELECT current_value 
FROM sys.sequences 
WHERE name = 'CustomerAddressIdSequence';

SELECT NEXT VALUE FOR dbo.CustomerAddressIdSequence;
DROP SEQUENCE dbo.CustomerAddressIdSequence

CREATE TABLE dbo.cp_order
(
    order_id    NVARCHAR(50)    NOT NULL,
    customer_id NVARCHAR(50)    ,
    [date]      DATETIME2      ,
    [status]    NVARCHAR(20)    ,
    subtotal    DECIMAL(12, 2) ,
    tax         DECIMAL(12, 2) ,
    total       DECIMAL(12, 2) ,
    notes       NVARCHAR(255)  ,

    CONSTRAINT PK_orders PRIMARY KEY (order_id)
);

DROP TABLE dbo.cp_order

select * from cp_order
select sum(total) from cp_order where status != 'cancelled'
select count(*) from cp_order where status = 'confirmed'

INSERT INTO cp_order
    (order_id, customer_id, [date], [status], subtotal, tax, total, notes)
VALUES
    ('OR001', 'CUS001', '2026-01-05', 'completed', 1509.96, 181.20, 1691.16, 'Gaming desktop and peripherals'),
    ('OR002', 'CUS002', '2026-01-08', 'completed', 969.97, 116.40, 1086.37, 'Office computer and monitors'),
    ('OR003', 'CUS003', '2026-01-12', 'completed', 989.96, 118.80, 1108.76, 'Laptop storage and memory upgrade'),
    ('OR004', 'CUS004', '2026-01-15', 'confirmed', 1919.97, 230.40, 2150.37, 'Gaming laptop and accessories'),
    ('OR005', 'CUS005', '2026-01-19', 'completed', 589.97, 70.80, 660.77, 'Graphics and power components'),
    ('OR006', '', '2026-01-22', 'completed', 1394.95, 167.39, 1562.34, 'Walk-in office equipment purchase'),
    ('OR007', 'CUS006', '2026-02-02', 'confirmed', 1079.97, 129.60, 1209.57, 'Laptop docking and display setup'),
    ('OR008', 'CUS007', '2026-02-06', 'completed', 1779.96, 213.60, 1993.56, 'Desktop graphics upgrade'),
    ('OR009', 'CUS008', '2026-02-10', 'cancelled', 1699.97, 204.00, 1903.97, 'Gaming laptop and additional storage'),
    ('OR010', '', '2026-02-14', 'completed', 844.95, 101.39, 946.34, 'Walk-in computer accessories'),
    ('OR011', 'CUS009', '2026-02-18', 'confirmed', 1079.95, 129.59, 1209.54, 'Monitor and storage purchase'),
    ('OR012', 'CUS010', '2026-02-21', 'completed', 299.95, 35.99, 335.94, 'Computer case and cooling components'),
    ('OR013', 'CUS011', '2026-03-01', 'completed', 1689.96, 202.80, 1892.76, 'Laptop memory upgrade'),
    ('OR014', '', '2026-03-05', 'confirmed', 879.96, 105.60, 985.56, 'Walk-in graphics and connectivity purchase'),
    ('OR015', 'CUS012', '2026-03-10', 'completed', 2749.97, 330.00, 3079.97, 'Multiple computer systems');

CREATE SEQUENCE dbo.OrderIdSequence
AS INT
START WITH 16
INCREMENT BY 1;

SELECT current_value 
FROM sys.sequences 
WHERE name = 'OrderIdSequence';

SELECT NEXT VALUE FOR dbo.OrderIdSequence;
DROP SEQUENCE dbo.OrderIdSequence

CREATE TABLE dbo.cp_order_product
(
    order_product_id NVARCHAR(50) NOT NULL,
    order_id          NVARCHAR(50),
    product_id        NVARCHAR(50),
    quantity          INT,

    CONSTRAINT PK_order_product_ids
        PRIMARY KEY (order_product_id),

    CONSTRAINT FK_orders
        FOREIGN KEY (order_id)
        REFERENCES dbo.cp_order (order_id),

    CONSTRAINT FK_products
        FOREIGN KEY (product_id)
        REFERENCES dbo.cp_product (product_id)
);

select * from cp_order_product
delete from cp_order_product

INSERT INTO cp_order_product
    (order_product_id, order_id, product_id, quantity)
VALUES
    -- Order 001: Subtotal 1509.96
    ('OP001', 'OR001', 'SKU-PC-001', 1),
    ('OP002', 'OR001', 'SKU-PC-005', 2),
    ('OP003', 'OR001', 'SKU-PC-006', 1),

    -- Order 002: Subtotal 969.97
    ('OP004', 'OR002', 'SKU-PC-002', 1),
    ('OP005', 'OR002', 'SKU-PC-008', 2),

    -- Order 003: Subtotal 989.96
    ('OP006', 'OR003', 'SKU-PC-003', 1),
    ('OP007', 'OR003', 'SKU-PC-009', 1),
    ('OP008', 'OR003', 'SKU-PC-010', 2),

    -- Order 004: Subtotal 1919.97
    ('OP009', 'OR004', 'SKU-PC-004', 1),
    ('OP010', 'OR004', 'SKU-PC-007', 1),
    ('OP011', 'OR004', 'SKU-PC-005', 1),

    -- Order 005: Subtotal 589.97
    ('OP012', 'OR005', 'SKU-PC-011', 1),
    ('OP013', 'OR005', 'SKU-PC-012', 1),
    ('OP014', 'OR005', 'SKU-PC-013', 1),

    -- Order 006: Subtotal 1394.95
    ('OP015', 'OR006', 'SKU-PC-002', 2),
    ('OP016', 'OR006', 'SKU-PC-006', 2),
    ('OP017', 'OR006', 'SKU-PC-016', 1),

    -- Order 007: Subtotal 1079.97
    ('OP018', 'OR007', 'SKU-PC-003', 1),
    ('OP019', 'OR007', 'SKU-PC-015', 1),
    ('OP020', 'OR007', 'SKU-PC-008', 1),

    -- Order 008: Subtotal 1779.96
    ('OP021', 'OR008', 'SKU-PC-001', 1),
    ('OP022', 'OR008', 'SKU-PC-011', 1),
    ('OP023', 'OR008', 'SKU-PC-014', 2),

    -- Order 009: Subtotal 1699.97
    ('OP024', 'OR009', 'SKU-PC-004', 1),
    ('OP025', 'OR009', 'SKU-PC-009', 2),

    -- Order 010: Subtotal 844.95
    ('OP026', 'OR010', 'SKU-PC-002', 1),
    ('OP027', 'OR010', 'SKU-PC-005', 1),
    ('OP028', 'OR010', 'SKU-PC-006', 2),
    ('OP029', 'OR010', 'SKU-PC-010', 1),

    -- Order 011: Subtotal 1079.95
    ('OP030', 'OR011', 'SKU-PC-007', 2),
    ('OP031', 'OR011', 'SKU-PC-008', 2),
    ('OP032', 'OR011', 'SKU-PC-009', 1),

    -- Order 012: Subtotal 299.95
    ('OP033', 'OR012', 'SKU-PC-013', 1),
    ('OP034', 'OR012', 'SKU-PC-014', 1),
    ('OP035', 'OR012', 'SKU-PC-012', 1),
    ('OP036', 'OR012', 'SKU-PC-016', 2),

    -- Order 013: Subtotal 1689.96
    ('OP037', 'OR013', 'SKU-PC-003', 2),
    ('OP038', 'OR013', 'SKU-PC-010', 2),

    -- Order 014: Subtotal 879.96
    ('OP039', 'OR014', 'SKU-PC-011', 1),
    ('OP040', 'OR014', 'SKU-PC-007', 1),
    ('OP041', 'OR014', 'SKU-PC-015', 1),
    ('OP042', 'OR014', 'SKU-PC-006', 1),

    -- Order 015: Subtotal 2749.97
    ('OP043', 'OR015', 'SKU-PC-001', 1),
    ('OP044', 'OR015', 'SKU-PC-002', 1),
    ('OP045', 'OR015', 'SKU-PC-003', 1);

CREATE SEQUENCE dbo.OrderProductIdSequence
AS INT
START WITH 46
INCREMENT BY 1;

SELECT current_value 
FROM sys.sequences 
WHERE name = 'OrderProductIdSequence';

SELECT NEXT VALUE FOR dbo.OrderProductIdSequence;
DROP SEQUENCE dbo.OrderProductIdSequence

CREATE TABLE cp_supplier (
    supplier_id       NVARCHAR(50) not null,
    name              NVARCHAR(150),
    contact_person    NVARCHAR(100),
    phone             NVARCHAR(30),
    email             NVARCHAR(150),
    address           NVARCHAR(300),
    tax_id_number     NVARCHAR(20),

    CONSTRAINT PK_cp_supplier
        PRIMARY KEY (supplier_id)
);

INSERT INTO cp_supplier
(
    supplier_id,
    name,
    contact_person,
    phone,
    email,
    address,
    tax_id_number
)
VALUES
(
    'SUP001',
    'TechSource Solutions',
    'Michael Anderson',
    '(212) 555-0101',
    'michael@techsourcesolutions.example',
    '350 Fifth Avenue, New York, NY 10118, USA',
    '12-3456789'
),
(
    'SUP002',
    'Global Computer Supplies',
    'Jennifer Williams',
    '(213) 555-0102',
    'jennifer@globalcomputers.example',
    '680 S Los Angeles Street, Los Angeles, CA 90014, USA',
    '23-4567890'
),
(
    'SUP003',
    'Prime Electronics',
    'Robert Johnson',
    '(312) 555-0103',
    'robert@primeelectronics.example',
    '233 S Wacker Drive, Chicago, IL 60606, USA',
    '34-5678901'
),
(
    'SUP004',
    'NextGen Hardware',
    'Sarah Miller',
    '(305) 555-0104',
    'sarah@nextgenhardware.example',
    '100 SE 2nd Street, Miami, FL 33131, USA',
    '45-6789012'
),
(
    'SUP005',
    'Digital Components Inc.',
    'David Brown',
    '(512) 555-0105',
    'david@digitalcomponents.example',
    '600 Congress Avenue, Austin, TX 78701, USA',
    '56-7890123'
);

select * from cp_supplier
delete from cp_supplier

CREATE TABLE cp_supplier_product
(
    supplier_product_id VARCHAR(10) primary key NOT NULL,
    supplier_id VARCHAR(10),
    product_id VARCHAR(20),
    price DECIMAL(10, 2),
);

INSERT INTO cp_supplier_product
(
    supplier_product_id,
    supplier_id,
    product_id,
    price
)
VALUES
    -- SUP001: TechSource Solutions
    ('SP001', 'SUP001', 'SKU-PC-001', 1150.00),
    ('SP002', 'SUP001', 'SKU-PC-002', 565.00),
    ('SP003', 'SUP001', 'SKU-PC-003', 695.00),
    ('SP004', 'SUP001', 'SKU-PC-005', 68.00),
    ('SP005', 'SUP001', 'SKU-PC-006', 21.50),
    ('SP006', 'SUP001', 'SKU-PC-007', 285.00),
    ('SP007', 'SUP001', 'SKU-PC-009', 82.00),
    ('SP008', 'SUP001', 'SKU-PC-011', 350.00),
    ('SP009', 'SUP001', 'SKU-PC-012', 92.00),
    ('SP010', 'SUP001', 'SKU-PC-013', 65.00),

    -- SUP002: Global Computer Supplies
    ('SP011', 'SUP002', 'SKU-PC-002', 550.00),
    ('SP012', 'SUP002', 'SKU-PC-003', 710.00),
    ('SP013', 'SUP002', 'SKU-PC-004', 1320.00),
    ('SP014', 'SUP002', 'SKU-PC-005', 66.50),
    ('SP015', 'SUP002', 'SKU-PC-006', 20.00),
    ('SP016', 'SUP002', 'SKU-PC-008', 132.00),
    ('SP017', 'SUP002', 'SKU-PC-009', 85.00),
    ('SP018', 'SUP002', 'SKU-PC-010', 35.50),
    ('SP019', 'SUP002', 'SKU-PC-014', 29.00),
    ('SP020', 'SUP002', 'SKU-PC-015', 99.00),

    -- SUP003: Prime Electronics
    ('SP021', 'SUP003', 'SKU-PC-001', 1180.00),
    ('SP022', 'SUP003', 'SKU-PC-003', 680.00),
    ('SP023', 'SUP003', 'SKU-PC-004', 1350.00),
    ('SP024', 'SUP003', 'SKU-PC-007', 278.00),
    ('SP025', 'SUP003', 'SKU-PC-009', 79.00),
    ('SP026', 'SUP003', 'SKU-PC-010', 34.00),
    ('SP027', 'SUP003', 'SKU-PC-011', 340.00),
    ('SP028', 'SUP003', 'SKU-PC-012', 89.00),
    ('SP029', 'SUP003', 'SKU-PC-014', 31.00),
    ('SP030', 'SUP003', 'SKU-PC-016', 26.00),

    -- SUP004: NextGen Hardware
    ('SP031', 'SUP004', 'SKU-PC-001', 1125.00),
    ('SP032', 'SUP004', 'SKU-PC-002', 580.00),
    ('SP033', 'SUP004', 'SKU-PC-005', 70.00),
    ('SP034', 'SUP004', 'SKU-PC-007', 295.00),
    ('SP035', 'SUP004', 'SKU-PC-008', 128.00),
    ('SP036', 'SUP004', 'SKU-PC-010', 37.00),
    ('SP037', 'SUP004', 'SKU-PC-011', 360.00),
    ('SP038', 'SUP004', 'SKU-PC-012', 95.00),
    ('SP039', 'SUP004', 'SKU-PC-013', 62.00),
    ('SP040', 'SUP004', 'SKU-PC-014', 28.50),

    -- SUP005: Digital Components Inc.
    ('SP041', 'SUP005', 'SKU-PC-003', 720.00),
    ('SP042', 'SUP005', 'SKU-PC-004', 1295.00),
    ('SP043', 'SUP005', 'SKU-PC-005', 72.00),
    ('SP044', 'SUP005', 'SKU-PC-006', 23.00),
    ('SP045', 'SUP005', 'SKU-PC-008', 140.00),
    ('SP046', 'SUP005', 'SKU-PC-009', 88.00),
    ('SP047', 'SUP005', 'SKU-PC-010', 38.00),
    ('SP048', 'SUP005', 'SKU-PC-011', 355.00),
    ('SP049', 'SUP005', 'SKU-PC-014', 33.00),
    ('SP050', 'SUP005', 'SKU-PC-015', 105.00),
    ('SP051', 'SUP005', 'SKU-PC-016', 28.00);

    select * from cp_supplier_product

    CREATE SEQUENCE dbo.SupplierProductIdSequence
    AS INT
    START WITH 52
    INCREMENT BY 1;

SELECT current_value 
FROM sys.sequences 
WHERE name = 'SupplierProductIdSequence';

CREATE TABLE cp_purchase_order
(
    purchase_order_id VARCHAR(20) NOT NULL PRIMARY KEY,
    supplier_id VARCHAR(20),
    order_date DATE,
    delivery_date DATE,
    status VARCHAR(20),
    subtotal DECIMAL(18,2) DEFAULT 0,
    tax DECIMAL(18,2) DEFAULT 0,
    delivery_cost DECIMAL(18,2) DEFAULT 0,
    total DECIMAL(18,2) DEFAULT 0,
);


CREATE TABLE cp_purchase_order_product
(
    purchase_order_product_id VARCHAR(20) NOT NULL PRIMARY KEY,
    purchase_order_id VARCHAR(20) NOT NULL,
    product_id VARCHAR(30) NOT NULL,
    quantity INT NOT NULL,    
);

select sum(total) from cp_purchase_order where status != 'cancelled'
select * from cp_purchase_order

INSERT INTO cp_purchase_order
(
    purchase_order_id,
    supplier_id,
    order_date,
    delivery_date,
    status,
    subtotal,
    tax,
    delivery_cost,
    total
)
VALUES
    ('PO001', 'SUP001', '2026-01-05', '2026-01-10', 'received', 2855.00, 342.60, 25.00, 3222.60),
    ('PO002', 'SUP002', '2026-01-12', '2026-01-18', 'received', 4715.00, 565.80, 30.00, 5310.80),
    ('PO003', 'SUP003', '2026-01-20', '2026-01-25', 'received', 3744.00, 449.28, 20.00, 4213.28),
    ('PO004', 'SUP004', '2026-02-02', '2026-02-08', 'received', 3245.00, 389.40, 35.00, 3669.40),
    ('PO005', 'SUP005', '2026-02-10', '2026-02-16', 'received', 2716.00, 325.92, 25.00, 3066.92),

    ('PO006', 'SUP001', '2026-02-20', '2026-02-25', 'received', 1879.00, 225.48, 20.00, 2124.48),
    ('PO007', 'SUP002', '2026-03-01', '2026-03-07', 'received', 2116.00, 253.92, 30.00, 2399.92),
    ('PO008', 'SUP003', '2026-03-10', '2026-03-16', 'received', 3968.00, 476.16, 25.00, 4469.16),
    ('PO009', 'SUP004', '2026-03-18', '2026-03-24', 'received', 1805.00, 216.60, 35.00, 2056.60),
    ('PO010', 'SUP005', '2026-03-25', '2026-03-31', 'received', 3678.00, 441.36, 20.00, 4139.36),

    ('PO011', 'SUP001', '2026-04-05', '2026-04-11', 'ordered', 2720.00, 326.40, 25.00, 3071.40),
    ('PO012', 'SUP002', '2026-04-12', '2026-04-18', 'ordered', 1975.00, 237.00, 30.00, 2242.00),
    ('PO013', 'SUP003', '2026-04-20', '2026-04-26', 'ordered', 2797.00, 335.64, 20.00, 3152.64),
    ('PO014', 'SUP004', '2026-04-25', '2026-05-01', 'ordered', 2025.00, 243.00, 35.00, 2303.00),
    ('PO015', 'SUP005', '2026-05-02', '2026-05-08', 'cancelled', 2580.00, 309.60, 25.00, 2914.60);

    INSERT INTO cp_purchase_order_product
(
    purchase_order_product_id,
    purchase_order_id,
    product_id,
    quantity
)
VALUES
    -- PO001 - SUP001
    ('POP001', 'PO001', 'SKU-PC-001', 2),
    ('POP002', 'PO001', 'SKU-PC-005', 5),
    ('POP003', 'PO001', 'SKU-PC-006', 10),

    -- PO002 - SUP002
    ('POP004', 'PO002', 'SKU-PC-002', 3),
    ('POP005', 'PO002', 'SKU-PC-004', 2),
    ('POP006', 'PO002', 'SKU-PC-009', 5),

    -- PO003 - SUP003
    ('POP007', 'PO003', 'SKU-PC-001', 2),
    ('POP008', 'PO003', 'SKU-PC-007', 4),
    ('POP009', 'PO003', 'SKU-PC-010', 8),

    -- PO004 - SUP004
    ('POP010', 'PO004', 'SKU-PC-002', 4),
    ('POP011', 'PO004', 'SKU-PC-008', 5),
    ('POP012', 'PO004', 'SKU-PC-014', 10),

    -- PO005 - SUP005
    ('POP013', 'PO005', 'SKU-PC-003', 3),
    ('POP014', 'PO005', 'SKU-PC-006', 12),
    ('POP015', 'PO005', 'SKU-PC-016', 10),

    -- PO006 - SUP001
    ('POP016', 'PO006', 'SKU-PC-007', 3),
    ('POP017', 'PO006', 'SKU-PC-009', 8),
    ('POP018', 'PO006', 'SKU-PC-012', 4),

    -- PO007 - SUP002
    ('POP019', 'PO007', 'SKU-PC-003', 2),
    ('POP020', 'PO007', 'SKU-PC-005', 6),
    ('POP021', 'PO007', 'SKU-PC-015', 3),

    -- PO008 - SUP003
    ('POP022', 'PO008', 'SKU-PC-004', 2),
    ('POP023', 'PO008', 'SKU-PC-011', 3),
    ('POP024', 'PO008', 'SKU-PC-014', 8),

    -- PO009 - SUP004
    ('POP025', 'PO009', 'SKU-PC-001', 1),
    ('POP026', 'PO009', 'SKU-PC-010', 10),
    ('POP027', 'PO009', 'SKU-PC-013', 5),

    -- PO010 - SUP005
    ('POP028', 'PO010', 'SKU-PC-004', 2),
    ('POP029', 'PO010', 'SKU-PC-008', 4),
    ('POP030', 'PO010', 'SKU-PC-009', 6),

    -- PO011 - SUP001
    ('POP031', 'PO011', 'SKU-PC-002', 3),
    ('POP032', 'PO011', 'SKU-PC-011', 2),
    ('POP033', 'PO011', 'SKU-PC-013', 5),

    -- PO012 - SUP002
    ('POP034', 'PO012', 'SKU-PC-004', 1),
    ('POP035', 'PO012', 'SKU-PC-006', 15),
    ('POP036', 'PO012', 'SKU-PC-010', 10),

    -- PO013 - SUP003
    ('POP037', 'PO013', 'SKU-PC-003', 3),
    ('POP038', 'PO013', 'SKU-PC-012', 5),
    ('POP039', 'PO013', 'SKU-PC-016', 12),

    -- PO014 - SUP004
    ('POP040', 'PO014', 'SKU-PC-005', 8),
    ('POP041', 'PO014', 'SKU-PC-007', 4),
    ('POP042', 'PO014', 'SKU-PC-014', 10),

    -- PO015 - SUP005
    ('POP043', 'PO015', 'SKU-PC-003', 2),
    ('POP044', 'PO015', 'SKU-PC-005', 10),
    ('POP045', 'PO015', 'SKU-PC-015', 4);

    select * from cp_purchase_order_product

    select * from cp_purchase_order

    CREATE SEQUENCE dbo.PurchaseOrderIdSequence
    AS INT
    START WITH 16
    INCREMENT BY 1;

    CREATE SEQUENCE dbo.PurchaseOrderProductIdSequence
    AS INT
    START WITH 46
    INCREMENT BY 1;

  select pop.product_id, p.name, sp.price, pop.quantity, p.img from cp_purchase_order_product pop
  inner join cp_product p on pop.product_id = p.product_id
  inner join cp_purchase_order po on pop.purchase_order_id = po.purchase_order_id
  inner join cp_supplier_product sp on po.supplier_id = sp.supplier_id and pop.product_id = sp.product_id
  where pop.purchase_order_id = 'PO007'