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

6- when i started the session from the admin and signed out the session stopped, i want it to continue till either mentor of this class end it or the admin end it and notifies everyone in the class who ended it or it keeps going till its allowed time ends which is one and half or 2 hours as it takes in the schedule.

7- i want the session of the class to be with camera and live syncing and everything as implemented till 20 min of its starting time then mentor can enroll manually. This simulates as time allowed to join the lecture is 20 min then there will be no enrollment and it will be wasted resources on camera and attendance system to be active we can make light version of attendance where it activates after 20 mins for status and spectating purposes. note: after 20 mins mentor can still enroll students manually.

8- this will contradict a prevois request but i want to disable the featue of admin starting session or not the only one who can start and end the session is the mentor as a privacy for a doctor in his lecture to start whenever and end whenever he likes not the admin ruining his work by mistake but the admin can only spectate.

9- check the compatability of the system to work in parallel sessions as lectures should be working concurrently not sequentially.

10- admin attendance tab should be able to spectate many active classes at the same time as lectures will be working together concurrently.

11- there is something wrong with the face enrollment where i don't see my self in the camera so that i be able to position my self as required and didn't get results check whether these photos are compatable or not, but i want to do something, i want the face enrollment to be as face enrollment on iphone where the camera opens and there is guides to how to position yourself in the camera and photos are taken automatically as much as needed (the process of iphone face enrollment is smooth and the detection is super accurate)

12- when signing out check are you sure instead of signing out directly



wy4ECQMIX6xcAFQzR3XgChZBkiPduNgETW89M5Qe06GqV92ztIy5J1iQqD14o_Ea0oIBsok2XL8oZKAvSyjCTT1XgQQ1Ns_HOFORYmBQzYLPpQa1qdhOydxodCaS6EsPx-1hO8T71AfyczjUGnV4Utrh--UtDTQwQ7ToqKmU0yJpQHiFesV8tbsFBVW8Qk6uk1k9-KKPSwGQ0yEBnLk2UPn41FNd-9DKogD4uazAPpFzZhvV