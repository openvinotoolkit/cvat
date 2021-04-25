---
title: "Getting started"
linkTitle: "Getting started"
weight: 1
---
### Authorization

- First of all, you have to log in to CVAT tool.

  ![](../../../../images/image001.jpg)

- For register a new user press "Create an account"

  ![](../../../../images/image002.jpg)

- You can register a user but by default it will not have rights even to view
  list of tasks. Thus you should create a superuser. The superuser can use
  [Django administration panel](http://localhost:8080/admin) to assign correct
  groups to the user. Please use the command below to create an admin account:

  `docker exec -it cvat bash -ic 'python3 ~/manage.py createsuperuser'`

- If you want to create a non-admin account, you can do that using the link below
  on the login page. Don't forget to modify permissions for the new user in the
  administration panel. There are several groups (aka roles): admin, user,
  annotator, observer.

  ![](../../../../images/image003.jpg)

### Administration panel

Go to the [Django administration panel](http://localhost:8080/admin). There you can:

- Create / edit / delete users
- Control permissions of users and access to the tool.

  ![](../../../../images/image115.jpg)