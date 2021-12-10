import { fireEvent, screen } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { localStorageMock } from "../__mocks__/localStorage"
import { ROUTES } from "../constants/routes"
import firebase from  '../__mocks__/firebase'
import userEvent from '@testing-library/user-event'


describe("Given I am connected as an employee", () => {
    let onNavigate;
    let newBill;

    beforeEach(() => {
      onNavigate = (pathname) => {document.body.innerHTML = ROUTES({ pathname })}
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      const user = JSON.stringify({
        type: 'Employee',
        email: 'test@thet'
      })
      window.localStorage.setItem('user', user)
      document.body.innerHTML = NewBillUI();
    })
  
  describe("When I am on a Newbill Page and I submit the form correctly", () => {
    test("Then I should submit a valid bill", () => {
      let firestore = {
        bills(){
          return {
            add(bill){
              return new Promise((resolve)=>{
                resolve()
              })
            }
          }
        },
        storage: {
          ref(filename) {
            return {
              put(file){
                return new Promise((resolve) => {
                  resolve({
                    ref: {
                      getDownloadURL() {
                        return 'url'
                      }
                    }
                  })
                })
              }
            }
          }
        },
      }
      newBill = new NewBill({
        document,
        onNavigate,
        firestore,
        localStorage: window.localStorage,
      })

      const expenseType = screen.getByTestId('expense-type')
      userEvent.selectOptions(expenseType, [ screen.getByText('Travels') ])

      const date = screen.getByTestId('datepicker')
      userEvent.type(date, '2021-07-19')

      const amount = screen.getByTestId('amount')
      userEvent.type(amount, '23')

      const pct = screen.getByTestId('pct')
      userEvent.type(pct, '20')

      const fileUpload = screen.getByTestId('file')
      const file = new File(['test'], 'test.png', { type: 'image/png' })
      userEvent.upload(fileUpload, file)
      expect(fileUpload.files).toHaveLength(1)

      const handleSubmit = jest.fn(newBill.handleSubmit);
      newBill.fileName = "test.jpg";

      const newBillForm = screen.getByTestId("form-new-bill");
      newBillForm.addEventListener("submit", handleSubmit);
      fireEvent.submit(newBillForm)

      expect(handleSubmit).toHaveBeenCalledTimes(1);
    })

    test("Then I should be redirected to Bills Page", () => {
      newBill = new NewBill({
        document,
        onNavigate,
        firestore: null,
        localStorage: window.localStorage,
      })

      const handleSubmit = jest.fn(newBill.handleSubmit);
      newBill.fileName = "test.jpg";

      const newBillForm = screen.getByTestId("form-new-bill");
      newBillForm.addEventListener("submit", handleSubmit);
      fireEvent.submit(newBillForm)

      expect(handleSubmit).toHaveBeenCalled();
      expect(screen.getAllByText("My fees")).toBeTruthy();
    })
  })

  describe("When I am on a Newbill Page and I choose an unsupported file", () => {
    test("It won't allow the file to upload", () => {
      let firestore = {
        get(){
  
        },
        storage: {
          ref(filename) {
            return {
              put(file){
                return new Promise((resolve) => {
                  resolve({
                    ref: {
                      getDownloadURL() {
                        return 'url'
                      }
                    }
                  })
                })
              }
            }
          }
        },
      }
      newBill = new NewBill({
        document,
        onNavigate,
        firestore,
        localStorage: window.localStorage,
      })
      const file = screen.getByTestId('file')
      const handleChangeFile = jest.fn(newBill.handleChangeFile)
      file.addEventListener('change', handleChangeFile)
      fireEvent.change(file, { 
        target: {
          files: [new File([''], 'fake.gif', {
            type: 'image/gif'
          })],
        }
      })
      expect(handleChangeFile).toHaveBeenCalled()
    })
    
  })
})

describe("When I fill a new bill form", () => {
  const dataBill = {
    "vat": "80",
    "fileUrl": "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
    "type": "Travels",
    "commentary": "test",
    "name": "test",
    "fileName": "preview-facture-free-201801-pdf-1.jpg",
    "date": "2004-04-09",
    "amount": 400,
    "email": "a@a",
    "pct": 20
  }
  test("Then push new bill to mock API post", async () => {
      const postSpy = jest.spyOn(firebase, "post")
      const bills = await firebase.post(dataBill)
      expect(postSpy).toHaveBeenCalledTimes(1)
      expect(postSpy).toReturn()
      expect(dataBill).toHaveProperty("amount")
      expect(dataBill.amount).toBeTruthy()
  })
})
