import { useCallback, useEffect } from 'react';
import {enablePromise, openDatabase, SQLiteDatabase} from 'react-native-sqlite-storage';

// SQLite için promise'i etkinleştir
enablePromise(true);

export const connectToDatabase = async () => {
  return openDatabase(
    {name: 'yourProjectName.db', location: 'default'},
    () => {},
    (error: any) => {
      console.error(error);
      throw Error('Veritabanına bağlanılamadı');
    },
  );
};

export const createTables = async (db: SQLiteDatabase) => {
  const userPreferencesQuery = `
    CREATE TABLE IF NOT EXISTS UserPreferences (
        id INTEGER DEFAULT 1,
        colorPreference TEXT,
        languagePreference TEXT,
        PRIMARY KEY(id)
    )
  `
  const contactsQuery = `
   CREATE TABLE IF NOT EXISTS Contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT,
      name TEXT,
      phoneNumber TEXT
   )
  `
  try {
    await db.executeSql(userPreferencesQuery)
    await db.executeSql(contactsQuery)
  } catch (error) {
    console.error(error)
    throw Error(`Failed to create tables`)
  }
}

// Usage
// const loadData = useCallback(async () => {
//   try {
//     const db = await connectToDatabase()
//     await createTables(db)
//   } catch (error) {
//     console.error(error)
//   }
// }, [])

// useEffect(() => {
//   loadData()
// }, [loadData])

export const getTableNames = async (db: SQLiteDatabase): Promise<string[]> => {
  try {
    const tableNames: string[] = []
    const results = await db.executeSql(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    )
    results?.forEach((result) => {
      for (let index = 0; index < result.rows.length; index++) {
        tableNames.push(result.rows.item(index).name)
      }
    })
    return tableNames
  } catch (error) {
    console.error(error)
    throw Error("Failed to get table names from database")
  }
}

export const removeTable = async (db: SQLiteDatabase, tableName: string /* can be Table class */) => {
  const query = `DROP TABLE IF EXISTS ${tableName}`
  try {
    await db.executeSql(query)
  } catch (error) {
    console.error(error)
    throw Error(`Failed to drop table ${tableName}`)
  }
}