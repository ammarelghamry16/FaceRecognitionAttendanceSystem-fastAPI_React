in terminal
cd into FastAPI folder then
write .\.venv\Scripts\activate (to activate the virtual environment)
then write python .\main.py  (therefore application will start)



First time cloning project:

    1. clone the project via github link

    2. in terminal run the following commands
        cd .\fastAPI                        (to go inside backend folder)
        python -m venv venv                 (to create the virtual environment)
        .\venv\Scripts\activate             (to activate the virtual environment)
        pip install -r requirements.txt     (to install libraries that are mentioned in requirements.txt)
        python .\main.py                    (to run the backend server)

    3. in new terminal run the following
        cd .\frontend                       
        npm install                         (to install dependencies and requirements of react)
        npm run dev                         (to start the frontend server)



Everytime developing in project write in terminal:

    git pull origin main 

    cd backend
    .\venv\Scripts\activate
    pip install -r requirements.txt     (if there is new library added in requirements.txt)
    uvicorn main:app --reload

    cd frontend
    npm run dev 