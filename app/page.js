'use client'
import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDoc, getDocs, querySnapshot, query, onSnapshot, deleteDoc, doc, updateDoc, where } from "firebase/firestore";
import { db } from './firebase'


export default function Home() {
  const [pantry, setItems] = useState([
    // { name: 'Coffee', quantity: 2 },
    // { name: 'Apple', quantity: 3 },
    // { name: 'Lemon', quantity: 1 },
  ]);
  const [newItem, setNewItem] = useState({ name: '', quantity: '' })
  const [total, setTotal] = useState(0);

  // Sign out
  const handleSignOut = () => {
    auth.signOut();
  };

  // Adds item to database
  const addItem = async (e) => {
    e.preventDefault();

    if (newItem.name.trim() !== '' && newItem.quantity !== '' && newItem.quantity >= 1 && Number.isInteger(Number(newItem.quantity))) {
      const itemsRef = collection(db, 'pantry');
      const q = query(itemsRef, where('name', '==', newItem.name.trim()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Item exists, update its quantity
        querySnapshot.forEach(async (docSnapshot) => {
          const existingQuantity = parseInt(docSnapshot.data().quantity, 10);
          const newQuantity = existingQuantity + parseInt(newItem.quantity, 10);
          await updateDoc(doc(db, 'pantry', docSnapshot.id), {
            quantity: newQuantity.toString()
          });
        });
      } else {
        // Item does not exist, add new item
        await addDoc(collection(db, 'pantry'), {
          name: newItem.name.trim(),
          quantity: newItem.quantity.toString()
        });
      }

      setNewItem({ name: '', quantity: '' });
    }
  };

  //Reads item from database
  useEffect(() => {
    const q = query(collection(db, 'pantry'))
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let itemsArr = []

      querySnapshot.forEach((doc) => {
        itemsArr.push({ ...doc.data(), id: doc.id })
      })
      setItems(itemsArr)

      // Reads total from itemsArr
      const calculateTotal = () => {
        const totalInv = itemsArr.reduce((sum, item) => sum + parseInt(item.quantity), 0)
        setTotal(totalInv)
      }
      calculateTotal()
      return () => unsubscribe();
    });
  }, []);

  //Deletes item from database
  const deleteItem = async (id) => {
    await deleteDoc(doc(db, 'pantry', id))
  }

  // Reduce item quantity
  const reduceItemQuantity = async (id) => {
    const itemRef = doc(db, 'pantry', id);

    // Get the current document
    const itemSnap = await getDoc(itemRef);

    if (itemSnap.exists()) {
      const currentQuantity = itemSnap.data().quantity;

      if (currentQuantity > 1) {
        // Reduce quantity by 1
        await updateDoc(itemRef, {
          quantity: currentQuantity - 1
        });
      } else {
        // Quantity is 1 or less, delete the document
        await deleteDoc(itemRef);
      }
    }
  };

  const increaseItemQuantity = async (id) => {
    const itemRef = doc(db, 'pantry', id);

    // Get the current document
    const itemSnap = await getDoc(itemRef);

    if (itemSnap.exists()) {
      const currentQuantity = parseInt(itemSnap.data().quantity, 10);

      await updateDoc(itemRef, {
        quantity: (currentQuantity + 1).toString()
      });
    }
  };

  return (
    <main className="flex min-h-screen flex-col pantry-center justify-between sm:p-24 p-4 bg-slate-700">
      <div className="z-10 w-full pantry-center justify-between font-mono text-sm">
        <h1 className="text-4xl p-4 text-center mx-11 my-2 bg-neutral-800 rounded-2xl outline outline-offset-2 outline-2 outline-black">🍉 Pantry Management System 🍉</h1>
        <div className="bg-neutral-800 p-6 rounded-xl outline outline-offset-1 outline-1 outline-white">
          <form className="grid grid-cols-7 pantry-center text-black ">
            <input value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} className="col-span-3 p-3 border rounded-lg outline outline-offset-2 outline-black" type="text" placeholder="Enter Item"></input>
            <input value={newItem.quantity} onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })} className="col-span-3 p-3 border mx-3 rounded-lg outline outline-offset-2 outline-black" type="number" step="1" placeholder="Enter Quantity"></input>
            <button onClick={addItem} className="text-white bg-green-100 hover:bg-green-300 p-2 text-2xl rounded-full outline outline-offset-2 outline-green-300" type="submit">✅</button>
          </form>
          <ul>
            {pantry.map((item, id) => (
              <li key={id} className="my-4 w-full flex justify-between bg-zinc-900 rounded-md border-2 border-slate-600">
                <div className="p-4 w-full flex justify-between">
                  <span className="capitalize">{item.name}</span>
                  <span>{item.quantity}</span>
                </div>
                <button onClick={() => increaseItemQuantity(item.id)} className='ml-2 p-4 bg-yellow-200 border-l-2 hover:bg-yellow-300 w-17 border-2 border-yellow-500 rounded-md'>➕</button>
                <button onClick={() => reduceItemQuantity(item.id)} className='ml-2 p-4 bg-blue-200 border-l-2 hover:bg-blue-300 w-17 border-2 border-blue-500 rounded-md'>➖</button>
                <button onClick={() => deleteItem(item.id)} className='ml-2 p-4 bg-rose-200 border-l-2 hover:bg-rose-300 w-17 border-2 border-rose-500 rounded-md'>❌</button>
              </li>
            ))}
          </ul>
          {pantry.length < 1 ? ('') : (
            <div className='flex justify-between p-3'>
              <span>Total Count</span>
              <span>{total}</span>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
