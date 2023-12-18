/* eslint-disable no-unused-vars */
// models/todo.js
"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    static async addTask(params) {
      return await Todo.create(params);
    }
    static async showList() {
      console.log("My Todo list \n");

      console.log("Overdue");
      const overdueItems = await Todo.overdue();
      overdueItems.forEach((item) => console.log(item.displayableString()));
      console.log("\n");

      console.log("Due Today");
      const dueTodayItems = await Todo.dueToday();
      dueTodayItems.forEach((item) => console.log(item.displayableString()));
      console.log("\n");

      console.log("Due Later");
      const dueLaterItems = await Todo.dueLater();
      dueLaterItems.forEach((item) => console.log(item.displayableString()));
    }

    static async overdue() {
      return await Todo.findAll({
        where: {
          dueDate: {
            [sequelize.Sequelize.Op.lt]: new Date(),
          },
        },
      });
    }

    static async dueToday() {
      return await Todo.findAll({
        where: {
          dueDate: {
            [sequelize.Sequelize.Op.eq]: new Date(),
          },
          completed: false,
        },
      });
    }

    static async dueLater() {
      return await Todo.findAll({
        where: {
          dueDate: {
            [sequelize.Sequelize.Op.gt]: new Date(),
          },
          completed: false,
        },
      });
    }

    static async markAsComplete(id) {
      const todo = await Todo.findByPk(id);
      if (todo) {
        todo.completed = true;
        await todo.save();
      } else {
        console.log(`Todo with ID ${id} not found.`);
      }
    }

    displayableString() {
      let checkbox = this.completed ? "[x]" : "[ ]";
      let dateString = "";

      // Check if the dueDate is not today
      if (this.dueDate && !this.isDueToday()) {
        dateString = ` ${this.dueDate}`;
      }

      return `${this.id}. ${checkbox} ${this.title}${dateString}`;
    }

    isDueToday() {
      // Helper method to check if the dueDate is today
      const today = new Date();
      const dueDate = new Date(this.dueDate);

      return (
        today.getFullYear() === dueDate.getFullYear() &&
        today.getMonth() === dueDate.getMonth() &&
        today.getDate() === dueDate.getDate()
      );
    }
  }

  Todo.init(
    {
      title: DataTypes.STRING,
      dueDate: DataTypes.DATEONLY,
      completed: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Todo",
    },
  );
  return Todo;
};
