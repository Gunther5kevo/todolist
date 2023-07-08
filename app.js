const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect('mongodb://127.0.0.1:27017/todolistDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "<hit the +  to add an item!"
});
const item3 = new Item({
  name: "<--- hit this to delete an item"
});
const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  Item.find({})
    .then(foundItems => {
      if (foundItems.length === 0) {
        (async function() {
          try {
            await Item.insertMany(defaultItems);
            console.log("Successfully saved items into todolistDB");
            res.redirect("/");
          } catch (err) {
            console.error("Error:", err);
          }
        })();
      } else {
        res.render("list", {
          listTitle: "Today",
          newListItems: foundItems
        });
      }
    })
    .catch(err => {
      console.error("Error:", err);
    });


});

app.get("/:customName", async function(req, res) {
  const customName =_.capitalize(req.params.customName);

  try {
    const foundList = await List.findOne({ name: customName }).exec();

    if (foundList) {
      res.render("list", {
        listTitle: foundList.name,
        newListItems: foundList.items
      });
    } else {
      const newList = new List({
        name: customName,
        items: defaultItems
      });

      await newList.save();
       res.redirect("/" + customName);
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("An error occurred");
  }
});


app.post("/", async function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  try {
    if (listName === "Today") {
      await item.save();
      res.redirect("/");
    } else {
      const foundList = await List.findOne({ name: listName }).exec();
        foundList.items.push(item);
        await foundList.save();
        res.redirect("/" + listName);
      }
  } catch (err) {
    console.log(err);
    res.status(500).send("An error occurred");
  }
});



app.post("/delete", async function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    try {
      await Item.findByIdAndRemove(checkedItemId);
      console.log("Item deleted successfully");
      res.redirect("/");
    } catch (err) {
      console.error("Error deleting item:", err);
      res.status(500).send("An error occurred");
    }
  } else {
    try {
      await List.findOneAndUpdate(
        { name: listName },
        { $pull: { items: { _id: checkedItemId } } },
        { useFindAndModify: false }
      );
      res.redirect("/" + listName);
    } catch (err) {
      console.error("Error deleting item:", err);
      res.status(500).send("An error occurred");
    }
  }
});



app.post("/work", function(req, res) {
  let item = req.body.newItem;

  workItems.push(item);
  res.redirect("/work");
})



app.listen(3000, function() {
  console.log("Server is running on port 3000");
});
