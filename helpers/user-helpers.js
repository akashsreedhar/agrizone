var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const { response } = require('express')
const { resolve } = require('path')
const { rejects } = require('assert')
const { promises } = require('dns')
var objectId = require('mongodb').ObjectID
module.exports = {
     verifyUserEmail: (email) => {
          return new Promise(async (resolve, reject) => {
               let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: email })
               resolve(user)
          })
     },
     doSignup: (userData) => {
          return new Promise(async (resolve, reject) => {
               let response = {}
               userData.Password = await bcrypt.hash(userData.Password, 10)
               db.get().collection(collection.USER_COLLECTION).insertOne(userData).then(async (res) => {
                    let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: res.insertedId })
                    console.log("ithaan response")
                    console.log(response);
                    response.user = user
                    response.status = true
                    resolve(response);
               })


          })

     },
     profileUpdate: (profileData, userId) => {
          return new Promise((resolve, reject) => {
               db.get().collection(collection.USER_COLLECTION).updateOne(
                    { _id: objectId(userId) },
                    { $set: { Mobile: profileData.Mobile, Address: profileData.Address, Pincode: profileData.Pincode, Country: profileData.Country, State: profileData.State, Status: 'active', mode: true } }, { multi: true }).then(() => {
                         resolve()
                    })
          })
     },
     doLogin:(userData)=>{
          return new Promise(async(resolve,reject)=>{
              let loginStatus=false
              let response={}
              let user=await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
              if(user){
                  bcrypt.compare(userData.Password,user.Password).then((status)=>{
                      if(status){
                          if(user.Status==='blocked'){
                              console.log('login failed user blocked')
                              resolve({status:false,error:'User Blocked By Admin'})
                          }else{
                          console.log("login success")
                          response.user=user
                          response.status=true
                          resolve(response)
                      }
                      }
                      else{
                          console.log("login failed");
                          resolve({status:false,error:'Password does not match'})
                      }
                  })
              }else{
                  console.log("login failed")
                  resolve({status:false,error:'User Not Found'})
              }
          })
      },
     addToCart: (proId, userId) => {
          let proObj = {
               item: objectId(proId),
               quantity: 1
          }
          return new Promise(async (resolve, reject) => {
               let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
               if (userCart) {
                    let proExist = userCart.products.findIndex(product => product.item == proId)
                    console.log(proExist);
                    if (proExist != -1) {
                         db.get().collection(collection.CART_COLLECTION)
                              .updateOne({ user: objectId(userId), 'products.item': objectId(proId) },
                                   {
                                        $inc: { 'products.$.quantity': 1 }
                                   }
                              ).then(() => {
                                   resolve()
                              })
                    } else
                         db.get().collection(collection.CART_COLLECTION)
                              .updateOne({ user: objectId(userId) },
                                   {

                                        $push: { products: proObj }

                                   }
                              ).then((response) => {
                                   resolve()
                              })
               } else {
                    let cartObj = {
                         user: objectId(userId),
                         products: [proObj]
                    }
                    db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                         resolve()
                    })

               }


          })
     },
     getCartProducts: (userId) => {
          return new Promise(async (resolve, reject) => {
               let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                    {
                         $match: { user: objectId(userId) }
                    },
                    {
                         $unwind: '$products'
                    },
                    {
                         $project: {
                              item: '$products.item',
                              quantity: '$products.quantity'
                         }
                    },
                    {
                         $lookup: {
                              from: collection.PRODUCT_COLLECTION,
                              localField: 'item',
                              foreignField: '_id',
                              as: 'product'
                         }
                    },
                    {
                         $project: {
                              item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }

                         }


                    }


               ]).toArray()
               console.log(cartItems);
               resolve(cartItems)
          })
     },
     getCartCount: (userId) => {
          return new Promise(async (resolve, reject) => {
               let count = 0
               let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
               if (cart) {
                    count = cart.products.length
               }
               resolve(count)
          })
     },
     changeProductQuantity: (details) => {
          details.count = parseInt(details.count)
          details.quantity = parseInt(details.quantity)

          return new Promise((resolve, reject) => {
               if (details.count == -1 && details.quantity == 1) {
                    db.get().collection(collection.CART_COLLECTION)
                         .updateOne({ _id: objectId(details.cart) },
                              {

                                   $pull: { products: { item: objectId(details.product) } }

                              }

                         ).then((response) => {

                              resolve({ removeProduct: true })
                         })

               } else {
                    db.get().collection(collection.CART_COLLECTION)
                         .updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) },
                              {
                                   $inc: { 'products.$.quantity': details.count }
                              }
                         ).then((response) => {
                              resolve({ status: true })
                         })
               }
          })

     },
     getTotalAmount: (userId) => {
          return new Promise(async (resolve, reject) => {
               let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                    {
                         $match: { user: objectId(userId) }
                    },
                    {
                         $unwind: '$products'
                    },
                    {
                         $project: {
                              item: '$products.item',
                              quantity: '$products.quantity'
                         }
                    },
                    {
                         $lookup: {
                              from: collection.PRODUCT_COLLECTION,
                              localField: 'item',
                              foreignField: '_id',
                              as: 'product'
                         }
                    },
                    {
                         $project: {
                              item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }

                         }


                    },
                    {
                         $group: {
                              _id: null,
                              total: { $sum: { $multiply: ['$quantity', { $toInt: '$product.Price' }] } }

                         }



                    }



               ]).toArray()
               console.log(total[0].total);
               resolve(total[0].total)
          })

     },
     placeOrder: (order, products, total) => {
          return new Promise((resolve, reject) => {
               console.log(order, products, total);
               let status = order['payment-method'] === 'COD' ? 'placed' : 'pending'
               let orderObj = {
                    deliveryDetails: {
                         mobile: order.mobile,
                         address: order.address,
                         pincode: order.pincode

                    },
                    userId: objectId(order.userId),
                    paymentMethod: order['payment-method'],
                    products: products,
                    totalAmount: total,
                    status: status,
                    date: new Date()
               }
               db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                    db.get().collection(collection.CART_COLLECTION).removeOne({ user: objectId(order.userId) })
                    resolve()
               })
          })

     },
     getCartProductList: (userId) => {
          return new Promise(async (resolve, reject) => {
               let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
               console.log(cart);
               resolve(cart.products)
          })
     },
     getUserOrders: (userId) => {
          return new Promise(async (resolve, reject) => {
               console.log(userId);
               let orders = await db.get().collection(collection.ORDER_COLLECTION)
                    .find({ userId: objectId(userId) }).toArray()
               console.log(orders);
               resolve(orders)
          })




     },
     getOrderProducts: (orderId) => {
          return new Promise(async (resolve, reject) => {
               let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                    {
                         $match: { _id: objectId(orderId) }
                    },
                    {
                         $unwind: '$products'
                    },
                    {
                         $project: {
                              item: '$products.item',
                              quantity: '$products.quantity'
                         }
                    },
                    {
                         $lookup: {
                              from: collection.PRODUCT_COLLECTION,
                              localField: 'item',
                              foreignField: '_id',
                              as: 'product'
                         }
                    },
                    {
                         $project: {
                              item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }

                         }


                    }

               ]).toArray()
               console.log(orderItems)
               resolve(orderItems)
          })
     },
     getAllOrder: () => {

          return new Promise(async (resolve, reject) => {
               let orders = await db.get().collection(collection.ORDER_COLLECTION).find().toArray()

               resolve(orders)
          })
     },

     doAdminLogin: (userData) => {
          return new Promise(async (resolve, reject) => {
               resolve(response.status = true)
          })
     },
     getallusers: () => {
          return new Promise(async (resolve, reject) => {
               let users = await db.get().collection(collection.USER_COLLECTION).find().toArray()
               resolve(users)
          })
     },
     getUserDetails:(userId)=>{
          return new Promise(async(resolve,reject)=>{
              
              console.log('this is user id');
              console.log(userId);
            let user= await  db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userId)})
            
              if(user){
                  console.log('user found');
                  console.log(user)
                  resolve(user)
               }
                else{
                    console.log("user not found");
                }
              })
          },
          editUser:(userId,userDetails)=>{
               return new Promise((resolve,reject)=>{
                 console.log('hloooooooooooooooooooo')
                 console.log(userDetails);
                   db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},{$set:{
                       
                       Name:userDetails.Name,
                       Email:userDetails.Email,
                       Password:userDetails.Password,
                       Address:userDetails.Address,
                       Country:userDetails.Country,
                       Mobile:userDetails.Mobile,
                       Pincode:userDetails.Pincode,
                       State:userDetails.State
                   }
               }).then((response)=>{
                  
                   resolve(response)
               })
               })
           }, 
           blockUser:(userId)=>{
               return new Promise((resolve,reject)=>{
                db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},{ $set: { "Status" : 'blocked', "mode":false } })
                resolve()
               })
           },
           unblockUser:(userId)=>{
              return new Promise((resolve,reject)=>{
                  db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},{ $set: { "Status" : 'active',"mode":true } })
                  resolve()
                 })
           }





}




