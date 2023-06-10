var express = require('express');
var router = express.Router();
var productHelpers=require('../helpers/product-helpers');
const userHelpers=require('../helpers/user-helpers')
const verifyLogin=(req,res,next)=>{
  if(req.session.loggedIn){
    next()
  }else{
    res.redirect('/login')
  }
}


/* GET home page. */
router.get('/',async function(req, res, next) {
  let user=req.session.user
  console.log(user);
  let cartCount=null
  if(req.session.user)
  {
  cartCount=await userHelpers.getCartCount(req.session.user._id)
}
  productHelpers.getAllProducts().then((products)=>{
    
    res.render('user/view-products',{products,user,cartCount})
}) 
});
router.get('/login',(req,res)=>{
  
  if(req.session.userloggedIn){
   
    res.redirect("/")
  }else{
    
  res.render("user/login",{"loginErr":req.session.userloginErr})
  req.session.userloginErr=false
  }
})
router.get('/signup',(req,res)=>{
  if(req.session.loggedIn)
  {
    res.redirect("/")
  }else{
    res.render("user/signup",{"signErr":req.session.usersigninErr})
    req.session.usersigninErr=null;

  
  }
})
router.post('/signup',async(req,res)=>{
  let useremailverify
   if(req.body.Email && req.body.Password && req.body.Name){

     useremailverify=await userHelpers.verifyUserEmail(req.body.Email)
     if(useremailverify){
      req.session.usersigninErr="User with this email already exist"
      res.redirect('/signup')
     }
     else{
    userHelpers.doSignup(req.body).then((response)=>{
      let n=response.user.Name.split(' ');
      let fname=n[0]
      req.session.user=response.user
      req.session.user.fname=fname;
      req.session.userloggedIn=true
         let user=req.session.user
        let username=response.user.Name
        let useremail=response.user.Email
      res.render('user/profile-form',{username,user,useremail})
  
  })
}   
}
else{
  req.session.usersigninErr="Enter All Credentials(Name,Email,Password)"
   res.redirect('/signup')
}
})
router.post('/updateProfile',(req,res)=>{
 
  console.log(req.body)
  console.log(req.query.id)
  userHelpers.profileUpdate(req.body,req.query.id).then(()=>{
    let image=req.files.Image
  image.mv('./public/user-image/'+req.query.id+'.jpg',(err,done)=>{
    if(!err){
     
     res.redirect('/')
    }else{
      console.log(err)
    }
  })
  })
})
router.post('/login',(req,res)=>{
  userHelpers.doLogin(req.body).then((response)=>{
    if(response.status){
      let n=response.user.Name.split(' ');
    let fname=n[0]
      console.log(fname)
      req.session.user=response.user
      req.session.user.fname=fname;
      console.log(req.session.user)
      req.session.userloggedIn=true
      res.redirect('/')
    }
    else{
      console.log(response.error)
      req.session.userloginErr=response.error
      res.redirect('/login')
    }
  })
})
router.get('/logout',(req,res)=>{
  req.session.destroy()
  res.redirect('/login')
})
router.get('/cart',async(req,res)=>{
  if(req.session.user){
let products=await userHelpers.getCartProducts(req.session.user._id)
let totalValue=0
if(req.session.user)
  {
  cartCount=await userHelpers.getCartCount(req.session.user._id)
}
if(products.length>0){
  let totalValue=await userHelpers.getTotalAmount(req.session.user._id)}
  console.log(products);

  
  res.render('user/cart',{products,users:req.session.user._id,totalValue,cartCount,user:req.session.user})
}
else{
  res.redirect('/login')
}
})
router.get('/add-to-cart/:id',(req,res)=>{
  console.log("api call");
  userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
   res.json({status:true})
  })
})
router.post('/change-product-quantity',(req,res,next)=>{
  console.log(req.body);
  userHelpers.changeProductQuantity(req.body).then(async(response)=>{
  response.total=await userHelpers.getTotalAmount(req.body.user)

 res.json(response)
  })
})
router.get('/place-order',verifyLogin,async(req,res)=>{
  let total=await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/place-order',{total,user:req.session.user})
})
router.post('/place-order',async(req,res)=>{
  let products=await userHelpers.getCartProductList(req.body.userId)
  let totalPrice=await userHelpers.getTotalAmount(req.body.userId)
  userHelpers.placeOrder(req.body,products,totalPrice).then((response)=>{
res.json({status:true})
  })
  console.log(req.body);
})
router.get('/order-success',(req,res)=>{
  res.render('user/order-success',{user:req.session.user})
})
router.get('/orders',async(req,res)=>{
  cartCount=await userHelpers.getCartCount(req.session.user._id)

  let orders=await userHelpers.getUserOrders(req.session.user._id)
  
    

  res.render('user/orders',{orders,cartCount,user:req.session.user})
})
router.get('/view-order-products/:id',async(req,res)=>{
  let products=await userHelpers.getOrderProducts(req.params.id)
  res.render('user/view-order-products',{user:req.session.user,products})
})
router.get('/product',async(req,res,next)=>{
  let user=req.session.user
  console.log(user);
  let cartCount=null
  if(req.session.user)
  {
  cartCount=await userHelpers.getCartCount(req.session.user._id)
}
  productHelpers.getAllProducts().then((products)=>{
  res.render('user/product',{products,user,cartCount})
})
})
router.get('/fruits',(req,res)=>{
  res.render('user/fruits')
})
router.get('/vegitables',(req,res)=>{
  res.render('user/vegitables')
})
router.get('/pestsides',(req,res)=>{
  res.render('user/pestsides')
})
router.get('/cerials',(req,res)=>{
  res.render('user/cerials')
})
router.get('/contact',(req,res)=>{
  res.render('user/contact',{user:req.session.user})
})



router.get('/user-profile',async (req,res)=>{
 
  let user=req.session.user
  let cartCount=null;
  if(user){
    cartCount=await userHelpers.getCartCount(req.session.user._id)
    console.log(cartCount)
  }
 let userDetails=await userHelpers.getUserDetails(req.session.user._id)


  res.render('user/profile',{userDetails,cartCount,user})
})
router.get('/edit-profile',async (req,res)=>{
  let user=req.session.user
  let userDetails=await userHelpers.getUserDetails(req.session.user._id)
  let cartCount=null;
  if(user){
    cartCount=await userHelpers.getCartCount(req.session.user._id)
  }
 
  res.render('user/edit-profile',{user,userDetails,cartCount})
})
router.post('/edit-profile',(req,res)=>{
  let user=req.session.user
  userHelpers.editUser(user._id,req.body).then(()=>{
    let n=req.body.Name.split(' ');
    let fname=n[0]
      console.log(fname)
      req.session.user.fname=fname;
  
  console.log(req.body)
  res.redirect('/')
  if(req.files.Image){
    let image=req.files.Image
    image.mv('./public/user-image/'+user._id+'.jpg')

  }
  
})
})
module.exports = router;
