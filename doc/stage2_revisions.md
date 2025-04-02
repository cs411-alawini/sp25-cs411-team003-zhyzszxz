ER/UML Diagram:
    Removed foreign keys.
    Excluded OrderItems as an entity (it serves as a relation between Orders and Products), directly connected related schemas.
    Corrected diagram is in doc/Stage2_Corrected_UML Diagram.drawio.pdf

Relational Schema:
    Removed the redundant customer_unique_id from Customers.
    In OrderItems, removed order_item_id and defined the composite primary key as (order_id, product_id).
    Moved seller_id from OrderItems to the Products table.
    In the end of the document, I also changed the schema organization to fit the comments.

Normalization Process:
    Added more details on the process of normalization
    Mentioned why specific tables are normalized would have been nice
    Provided some insights to 3 NF tables regarding sellers and customers
