---
title: "Filter"
linkTitle: "Filter"
weight: 16
---

There are some reasons to use the feature:

1. When you use a filter, objects that don't match the filter will be hidden.
1. The fast navigation between frames which have an object of interest.
   Use the `Left Arrow` / `Right Arrow` keys for this purpose
   or customize the UI buttons by right-clicking and select `switching by filter`.
   If there are no objects which correspond to the filter,
   you will go to the previous / next frame which contains any annotated objects.

To apply filters you need to click on the button on the top panel.

![](../../../../../images/image059.jpg)

It will open a window for filter input. Here you will find two buttons: `Add rule` and `Add group`.

![](../../../../../images/image202.jpg)

### Rules

The "Add rule" button adds a rule for objects display. A rule may use the following properties:

![](../../../../../images/image204.jpg)

**Supported properties:**

| Properties  | Supported values                                       | Description                                 |
| ----------- | ------------------------------------------------------ | --------------------------------------------|
| `Label`     | all the label names that are in the task               | label name                                  |
| `Type`      | shape, track or tag                                    | type of object                              |
| `Shape`     | all shape types                                        | type of shape                               |
| `Occluded`  | true or false                                          | occluded ([read more](../../../../../docs/for-users/user-guide/advanced/shape-mode-advanced/))|
| `Width`     | number of px or field                                  | shape width                                 |
| `Height`    | number of px or field                                  | shape height                                |
| `ServerID`  | number or field                                        | ID of the object on the server <br>(You can find out by forming a link to the object through the Action menu)|
| `ObjectID`  | number or field                                        | ID of the object in your client <br>(indicated on the objects sidebar)|
| `Attributes`| some other fields including attributes with a <br>similar type or a specific attribute value| any fields specified by a label |

**Supported operators for properties:**

`==` - Equally; `!=` - Not equal; `>` - More; `>=` - More or equal; `<` - Less; `<=` - Less or equal;

`Any in`; `Not in` - these operators allow you to set multiple values in one rule;

![](../../../../../images/image203.jpg)

`Is empty`; `is not empty` – these operators don't require to input a value.

`Between`; `Not between` – these operators allow you to choose a range between two values.

Some properties support two types of values that you can choose:

![](../../../../../images/image205.jpg)

You can add multiple rules, to do so click the add rule button and set another rule. Once you've set a new rule, you'll be able to choose which operator they will be connected by: `And` or `Or`.

![](../../../../../images/image206.jpg)

All subsequent rules will be joined by the chosen operator. Click `Submit` to apply the filter or if you want multiple rules to be connected by different operators, use groups.

### Groups

To add a group, click the "add group" button. Inside the group you can create rules or groups.

![](../../../../../images/image207.jpg)

If there is more than one rule in the group, they can be connected by `And` or `Or` operators.
The rule group will work as well as a separate rule outside the group and will be joined by an
 operator outside the group.
You can create groups within other groups, to do so you need to click the add group button within the group.

You can move rules and groups. To move the rule or group, drag it by the button.
To remove the rule or group, click on the `Delete` button.

![](../../../../../images/image208.jpg)

If you activate the `Not` button, objects that don't match the group will be filtered out.
Click `Submit` to apply the filter.
The "Cancel" button undoes the filter. The `Clear filter` button removes the filter.

Once applied filter automatically appears in `Recent used` list. Maximum length of the list is 10.
