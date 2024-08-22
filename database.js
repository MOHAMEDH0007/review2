import * as SQLite from 'expo-sqlite';
import { SECTION_LIST_MOCK_DATA } from './utils';

const db = SQLite.openDatabaseAsync('little_lemon');

export async function createTable() {
  const database = await db;
  return database.runAsync(
    'create table if not exists menuitems (id integer primary key not null, uuid text, title text, price text, category text);'
  );
}

export async function getMenuItems() {
  try {
    // Retrieve all items
    const database = await db;
    const allItems = await database.getAllAsync('SELECT * FROM menuitems');

    // Map items to the desired format
    const formattedItems = allItems.map((item) => ({
      category: item.category,
      id:       item.id,
      title:    item.title,
      price:    item.price,
    }));

    return formattedItems;
  } catch (error) {
    console.error('Error fetching menu items:', error);
  }
}


export async function saveMenuItems(menuItems) {
  try{
    const database = await db;
    const values = menuItems
      .map(
        (item) =>
          `('${item.uuid}', '${item.title}', '${item.price}', '${item.category}')`
        )
      .join(', ');
    const query = `INSERT INTO menuitems (uuid, title, price, category) VALUES ${values}`;

    await database.runAsync(
      query
    );

    console.log('Menu items saved successfully');
  }catch(error){
    console.error('Error saving menu items:', error);
  }

  /*db.transaction((tx) => {
    // 2. Implement a single SQL statement to save all menu data in a table called menuitems.
    // Check the createTable() function above to see all the different columns the table has
    // Hint: You need a SQL statement to insert multiple rows at once.
  });*/
}

export async function filterByQueryAndCategories(query, activeCategories) {
  try {
    const database = await db;

    const placeholders = activeCategories.map((_, i) => `$catValue${i}`).join(', ');
    const sqlQuery = `
      SELECT * FROM menuitems
      WHERE title LIKE $query
      AND category IN (${placeholders})
    `;

    const statement = await database.prepareAsync(sqlQuery);
    let allRows;

    try {
      const bindings = activeCategories.reduce((acc, category, i) => {
        acc[`$catValue${i}`] = category;
        return acc;
      }, { $query: `%${query}%` });

      const result = await statement.executeAsync(bindings);
      allRows = await result.getAllAsync();
      await result.resetAsync();
    } finally {
      await statement.finalizeAsync();
    }

    return allRows;
  } catch (error) {
    console.error('Error filtering menu items:', error);
    throw error;
  }
}

