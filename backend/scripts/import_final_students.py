import sys
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Student, StudentStatus

raw_data = """
1. DBU1800427 – Mengesha
2. DBU1800430 – Meseret
3. DBU1802629 – Miftah
4. DBU1800437 – Mihretu
5. DBU1800446 – Muluget
6. DBU1800448 – Nardos
7. DBU1802726 – Natnael
8. DBU1802739 – Negusu
9. DBU1800460 – Nigus
10. DBU1800467 – Rediet (Mulatu)
11. DBU1800470 – Rediet (Abebaw)
12. DBU1800473 – Roman
13. DBU1802825 – Saliha
14. DBU1800477 – Samrawit (Abere)
15. DBU1800478 – Samrawit (Getabalew)
16. DBU1800480 – Seada
17. DBU1800484 – Selamawit (Atilaw)
18. DBU1802879 – Selamawit (Mersha)
19. DBU1800486 – Senait
20. DBU1802893 – Setogn
21. DBU1800492 – Shewangizaw
22. DBU1800499 – Solomon
23. DBU1802944 – Suhila
24. DBU1800514 – Tesfanesh
25. DBU1803001 – Tigist
26. DBU1803022 – Toleshi
27. DBU1800525 – Tsegaye
28. DBU1803034 – Tsige
29. DBU1800528 – Tsion
30. DBU1800530 – Weleteamanuel
31. DBU1800531 – Wendye
32. DBU1800535 – Woldekidan
33. DBU1800539 – Wubit
34. DBU1800542 – Yalelet
35. DBU1800549 – Yeabkal
36. DBU1800554 – Yehualawerk
37. DBU1800552 – Yigerem
38. DBU1800560 – Yirgalem
39. DBU1800562 – Yitages
40. DBU1803171 – Yohanes
41. DBU1803184 – Yonatan
42. DBU1800575 – Yosef
43. DBU1803218 – Zelalem
44. DBU1800586 – Zenebe
45. DBU1800593 – Zinash
46. DBU1800528 – Getabalew Birhanu
47. DBU1800321 – Gebrekidan Gebrehiwot
48. DBU1800058 – Nigrem Kifle
49. DBU1800293 – Eyayu Yonus
50. DBU1802443 – Birhanu Demis
51. DBU1800210 – Bethlehem Goremus
52. DBU1800564 – Ychanes Haile
"""

def main():
    db: Session = SessionLocal()
    
    count_before = db.query(Student).count()
    print(f"Students before: {count_before}")
    
    added = 0
    existing = 0
    conflicts = 0
    seen_in_this_run = set()
    
    for line in raw_data.strip().split('\n'):
        if not line.strip(): continue
        # Parse "1. DBU1800427 – Mengesha"
        # Split on the first dot
        _, rest = line.split('.', 1)
        # Split on the hyphen
        parts = rest.split('–')
        if len(parts) != 2:
            parts = rest.split('-') # Fallback to normal hyphen
        
        student_id = parts[0].strip()
        name = parts[1].strip()
        
        if student_id in seen_in_this_run:
            error_msg = f"CRITICAL CONFLICT DETECTED: Student ID {student_id} is duplicated within the input list. Previously seen, now appears as '{name}'. Halting import to prevent data corruption."
            print(error_msg)
            raise ValueError(error_msg)
            
        seen_in_this_run.add(student_id)
        
        # Check if student exists
        existing_student = db.query(Student).filter(Student.student_id == student_id).first()
        
        if existing_student:
            if existing_student.full_name != name:
                error_msg = f"CRITICAL CONFLICT DETECTED: Student ID {student_id} is already registered as '{existing_student.full_name}'. Tried to add '{name}'. Halting import."
                print(error_msg)
                raise ValueError(error_msg)
            else:
                existing += 1
        else:
            new_student = Student(
                student_id=student_id,
                full_name=name,
                status=StudentStatus.ACTIVE
            )
            db.add(new_student)
            added += 1
            
    db.commit()
    
    count_after = db.query(Student).count()
    print("-" * 50)
    print(f"Number added: {added}")
    print(f"Number already existing: {existing}")
    print(f"Number of conflicts/duplicates skipped: {conflicts}")
    print(f"Final active student count: {count_after}")
    
if __name__ == "__main__":
    main()
