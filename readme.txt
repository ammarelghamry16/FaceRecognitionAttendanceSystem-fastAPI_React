First time cloning project:

    1. clone the project via github link

    2. in terminal run the following commands
        cd .\FastAPI                        (to go inside backend folder)
        python -m venv venv                 (to create the virtual environment)
        .\venv\Scripts\activate             (to activate the virtual environment)
        pip install -r requirements.txt     (to install libraries that are mentioned in requirements.txt)
        python .\main.py                    (to run the backend server)

    3. in new terminal run the following
        cd .\frontend                       
        npm install                         (to install dependencies and requirements of react)
        npm run dev                         (to start the frontend server)



Everytime developing the project write in terminal:

    
    1. git pull origin main 
    2. make sure you are on branch not the main project !!!!!
    
    3. run the following commands 
        in Terminal 1: 
        cd .\FastAPI
        .\venv\Scripts\activate
        uvicorn main:app --reload

        in new terminal (Terminal 2):
        cd frontend
        npm run dev 

    4. if you want to add new library related to fastAPI after installing the library run the following
        


okay these are the things i notivced that needs to be adjusted 

1- when applying wrong email and password the page reloads that makes and no notification appears making it seems weird 

2- in schedule tab when displaying all classes it extends till after the bottom of the page where sidebar ends and this section still extends and scrolls down, make it scrollable inside the page it self without scrolling down with the side bar and days of the week as it is independent scroll also apply it in all tabs 

3- in inrollments tab when selecting a session make the displayed name and id not the id only and when trying to enroll new student to be able to add it either by name or id and when trying name it searches among this class students for the student it self and suggests the names to select from 

4- we want to change the students ID from this (0c1aa010-9c41-44b4-9799-944900bf6db9) to this 2025/03897 as (year/maybe randon number or anything sutable to preserve uniqeness while also be able to write it manually )

5- when displaying notification make it dismissable instead of always displaying it the period of time then disappears also add sent since when like the ones on the iphone notification where it tills you this noti. was from x time 





